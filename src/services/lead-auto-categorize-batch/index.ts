import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDefaultTenantUserId } from '../../data/users';
import { processBatchAutoCategorize } from '../../ai/leads/batch-auto-categorize';
import {
  insertLeadAutoCategorizeBatchExchange,
  insertLeadAutoCategorizeBatchRequest,
  insertLeadAutoCategorizeBatchResponse,
  updateLeadAutoCategorizeBatchRequestCompletion,
  updateLeadAutoCategorizeBatchRequestFailed,
} from '../../data/lead-auto-categorize-batch';
import { getSupabaseClient } from '../../db/supabase-client';
import { getManagedAnthropicClient } from '../ai/anthropic-client';
import { verifyCronSecret } from '../lead-research-shared';

const TOKENS_PER_CREDIT = 11.11;
const MAX_LEADS = 10;

type CategoryBody = { id?: string; name?: string; normalized_name?: string };
type LeadBody = {
  id?: string;
  business_name?: string;
  description?: string | null;
  website?: string | null;
  address?: string | null;
  summary?: unknown | null;
};

const mergeAssignments = (
  inputLeadIds: string[],
  aiAssignments: { leadId: string; categoryId: string | null }[],
  allowedCategoryIds: Set<string>
): { leadId: string; categoryId: string | null }[] => {
  const byLead = new Map<string, string | null>();
  for (const a of aiAssignments) {
    if (!inputLeadIds.includes(a.leadId)) {
      continue;
    }
    let cat = a.categoryId;
    if (cat && !allowedCategoryIds.has(cat)) {
      cat = null;
    }
    if (!byLead.has(a.leadId)) {
      byLead.set(a.leadId, cat);
    }
  }
  return inputLeadIds.map((leadId) => ({
    leadId,
    categoryId: byLead.get(leadId) ?? null,
  }));
};

/**
 * POST /api/services/lead-auto-categorize-batch — batch categorize up to 10 leads (existing category ids or null).
 */
export const runLeadAutoCategorizeBatch = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const body = req.body as
    | { userId?: string; categories?: CategoryBody[]; leads?: LeadBody[] }
    | undefined;
  const categoriesRaw = Array.isArray(body?.categories) ? body.categories : [];
  const leadsRaw = Array.isArray(body?.leads) ? body.leads : [];

  if (leadsRaw.length === 0) {
    res.status(400).json({ success: false, error: 'leads must be a non-empty array' });
    return;
  }

  if (leadsRaw.length > MAX_LEADS) {
    res.status(400).json({
      success: false,
      error: `At most ${MAX_LEADS} leads allowed per request`,
    });
    return;
  }

  const categories = categoriesRaw
    .map((c) => ({
      id: typeof c.id === 'string' ? c.id.trim() : '',
      name: typeof c.name === 'string' ? c.name.trim() : '',
      normalized_name:
        typeof c.normalized_name === 'string' ? c.normalized_name.trim() : undefined,
    }))
    .filter((c) => c.id && c.name);

  const leads = leadsRaw.map((l) => ({
    id: typeof l.id === 'string' ? l.id.trim() : '',
    business_name: typeof l.business_name === 'string' ? l.business_name : '',
    description: l.description ?? null,
    website: l.website ?? null,
    address: l.address ?? null,
    summary: l.summary ?? null,
  }));

  if (leads.some((l) => !l.id)) {
    res.status(400).json({ success: false, error: 'Each lead must have a non-empty id' });
    return;
  }

  const inputLeadIds = leads.map((l) => l.id);
  const allowedCategoryIds = new Set(categories.map((c) => c.id));

  const supabase = getSupabaseClient();
  let userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  if (!userId) {
    userId = await getDefaultTenantUserId(supabase);
  }
  const requestId = uuidv4();

  const payload = { categories, leads };

  try {
    await insertLeadAutoCategorizeBatchRequest(supabase, {
      id: requestId,
      userId,
      payload,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('❌ runLeadAutoCategorizeBatch insert request:', message);
    res.status(500).json({ success: false, error: message });
    return;
  }

  const finishFailure = async (errorMessage: string): Promise<void> => {
    try {
      await updateLeadAutoCategorizeBatchRequestFailed(supabase, requestId);
    } catch (updateErr: unknown) {
      console.error('❌ runLeadAutoCategorizeBatch finishFailure:', updateErr);
    }
    res.status(500).json({ success: false, error: errorMessage });
  };

  if (categories.length === 0) {
    const assignments = inputLeadIds.map((leadId) => ({ leadId, categoryId: null as string | null }));
    const responseId = uuidv4();
    const exchangeId = uuidv4();
    const structured = { assignments, skippedReason: 'no_categories' };
    try {
      await insertLeadAutoCategorizeBatchResponse(supabase, responseId, structured);
      await insertLeadAutoCategorizeBatchExchange(supabase, {
        id: exchangeId,
        userId,
        requestId,
        responseId,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        creditsUsed: 0,
        tokensPerCredit: TOKENS_PER_CREDIT,
        modelUsed: 'none',
        status: 'completed',
      });
      await updateLeadAutoCategorizeBatchRequestCompletion(supabase, requestId, {
        exchangeId,
        responseId,
        status: 'completed',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      await finishFailure(message);
      return;
    }
    res.status(200).json({ success: true, requestId, assignments });
    return;
  }

  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    await finishFailure('ANTHROPIC_API_KEY not configured');
    return;
  }

  const ai = await processBatchAutoCategorize(anthropic, { categories, leads });

  if (!ai.success || ai.error) {
    await finishFailure(ai.error ?? 'AI categorization failed');
    return;
  }

  const assignments = mergeAssignments(inputLeadIds, ai.assignments, allowedCategoryIds);
  const responseStructured = { assignments };
  const responseId = uuidv4();

  try {
    await insertLeadAutoCategorizeBatchResponse(supabase, responseId, responseStructured);

    const totalTokens = ai.usage.input_tokens + ai.usage.output_tokens;
    const creditsUsed = totalTokens > 0 ? Math.ceil(totalTokens / TOKENS_PER_CREDIT) : 0;
    const exchangeId = uuidv4();

    await insertLeadAutoCategorizeBatchExchange(supabase, {
      id: exchangeId,
      userId,
      requestId,
      responseId,
      inputTokens: ai.usage.input_tokens,
      outputTokens: ai.usage.output_tokens,
      totalTokens,
      creditsUsed,
      tokensPerCredit: TOKENS_PER_CREDIT,
      modelUsed: ai.model,
      status: 'completed',
    });

    await updateLeadAutoCategorizeBatchRequestCompletion(supabase, requestId, {
      exchangeId,
      responseId,
      status: 'completed',
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('❌ runLeadAutoCategorizeBatch persist:', message);
    await finishFailure(message);
    return;
  }

  res.status(200).json({
    success: true,
    requestId,
    assignments,
  });
};
