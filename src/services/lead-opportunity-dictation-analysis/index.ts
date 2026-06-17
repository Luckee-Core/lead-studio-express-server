import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import { listColdEmailOfferingsForUser } from '../../data/cold-email-offering/list-for-user';
import {
  insertLeadOpportunityDictationExchange,
  insertLeadOpportunityDictationRequest,
  insertLeadOpportunityDictationResponse,
  updateLeadOpportunityDictationRequestCompletion,
} from '../../data/lead-opportunity-dictation';
import { insertLeadOpportunitySuggestionsForRequest } from '../../data/lead-opportunity-suggestions';
import { processSummarizeOpportunityDictation } from '../../ai/website-content/summarize-opportunity-dictation/process-summarize-opportunity-dictation';
import { getManagedAnthropicClient } from '../ai/anthropic-client';
import { verifyCronSecret } from '../lead-research-shared';

const TOKENS_PER_CREDIT = 11.11;

type OpportunitySuggestion = {
  id: string;
  title: string;
  description: string;
  reason: string;
  matchType: 'existing' | 'new';
  matchedServiceId: string | null;
  matchedServiceTitle: string | null;
  matchedServiceIds: string[];
  matchedServiceTitles: string[];
};

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const findMatchingService = (
  title: string,
  description: string,
  services: { id: string; title: string; description: string }[]
): { id: string; title: string } | null => {
  const titleNorm = normalize(title);
  const descNorm = normalize(description);
  for (const service of services) {
    const serviceTitleNorm = normalize(service.title);
    const serviceDescNorm = normalize(service.description || '');
    if (
      titleNorm === serviceTitleNorm ||
      serviceTitleNorm.includes(titleNorm) ||
      titleNorm.includes(serviceTitleNorm)
    ) {
      return { id: service.id, title: service.title };
    }
    if (
      titleNorm &&
      descNorm &&
      serviceDescNorm &&
      (serviceDescNorm.includes(titleNorm) || descNorm.includes(serviceTitleNorm))
    ) {
      return { id: service.id, title: service.title };
    }
  }
  return null;
};

const validateLinkedIds = (
  rawIds: string[],
  catalogById: Map<string, { id: string; title: string }>
): { ids: string[]; titles: string[] } => {
  const ids: string[] = [];
  const titles: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawIds) {
    const row = catalogById.get(raw);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      ids.push(row.id);
      titles.push(row.title);
    }
  }
  return { ids, titles };
};

const buildSuggestions = (
  opportunities: {
    title: string;
    description: string;
    reason: string;
    linkedServiceIds: string[];
  }[],
  services: { id: string; title: string; description: string }[]
): OpportunitySuggestion[] => {
  const catalogById = new Map(services.map((s) => [s.id, { id: s.id, title: s.title }]));

  return opportunities.map((item, index) => {
    const validated = validateLinkedIds(item.linkedServiceIds ?? [], catalogById);

    if (validated.ids.length > 0) {
      return {
        id: `op-${index + 1}`,
        title: item.title,
        description: item.description,
        reason: item.reason,
        matchType: 'existing' as const,
        matchedServiceId: validated.ids[0] ?? null,
        matchedServiceTitle: validated.titles[0] ?? null,
        matchedServiceIds: validated.ids,
        matchedServiceTitles: validated.titles,
      };
    }

    const fuzzy = findMatchingService(item.title, item.description, services);
    if (fuzzy) {
      return {
        id: `op-${index + 1}`,
        title: item.title,
        description: item.description,
        reason: item.reason,
        matchType: 'existing' as const,
        matchedServiceId: fuzzy.id,
        matchedServiceTitle: fuzzy.title,
        matchedServiceIds: [fuzzy.id],
        matchedServiceTitles: [fuzzy.title],
      };
    }

    return {
      id: `op-${index + 1}`,
      title: item.title,
      description: item.description,
      reason: item.reason,
      matchType: 'new' as const,
      matchedServiceId: null,
      matchedServiceTitle: null,
      matchedServiceIds: [],
      matchedServiceTitles: [],
    };
  });
};

export const runLeadOpportunityDictationAnalysis = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const body = req.body as { leadId?: string; userId?: string; notes?: string } | undefined;
  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';

  if (!leadId || !userId || !notes) {
    res.status(400).json({ success: false, error: 'leadId, userId, and notes are required' });
    return;
  }

  const supabase = getSupabaseClient();
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    res.status(503).json({ success: false, error: 'Anthropic client not configured' });
    return;
  }

  const requestId = uuidv4();

  try {
    const lead = await getLeadById(supabase, leadId);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    await insertLeadOpportunityDictationRequest(supabase, {
      id: requestId,
      userId,
      leadId,
      content: notes,
    });

    const offeredServices = await listColdEmailOfferingsForUser(supabase, userId);
    const ai = await processSummarizeOpportunityDictation(anthropic, {
      businessName: lead.business_name,
      address: lead.address ?? null,
      notes,
      existingServices: offeredServices.map((service) => ({
        id: service.id,
        title: service.title,
        description: service.description ?? '',
      })),
    });

    const suggestions = buildSuggestions(
      ai.opportunities,
      offeredServices.map((service) => ({
        id: service.id,
        title: service.title,
        description: service.description,
      }))
    );

    const responseStructured = {
      summary: ai.summary,
      suggestions,
    };

    const responseId = uuidv4();
    await insertLeadOpportunityDictationResponse(supabase, responseId, responseStructured);

    const exchangeId = uuidv4();
    const totalTokens = ai.usage
      ? ai.usage.input_tokens + ai.usage.output_tokens
      : 0;
    const creditsUsed = totalTokens > 0 ? Math.ceil(totalTokens / TOKENS_PER_CREDIT) : 0;

    await insertLeadOpportunityDictationExchange(supabase, {
      id: exchangeId,
      userId,
      leadId,
      requestId,
      responseId,
      inputTokens: ai.usage?.input_tokens ?? 0,
      outputTokens: ai.usage?.output_tokens ?? 0,
      totalTokens,
      creditsUsed,
      tokensPerCredit: TOKENS_PER_CREDIT,
      modelUsed: ai.model,
      status: ai.success ? 'completed' : 'failed',
    });

    await updateLeadOpportunityDictationRequestCompletion(supabase, requestId, {
      exchangeId,
      responseId,
      status: ai.success ? 'completed' : 'failed',
    });

    if (ai.success && suggestions.length > 0) {
      await insertLeadOpportunitySuggestionsForRequest(
        supabase,
        suggestions.map((s) => ({
          id: uuidv4(),
          userId,
          leadId,
          dictationRequestId: requestId,
          exchangeId,
          sourceSuggestionId: s.id,
          title: s.title,
          description: s.description,
          reason: s.reason,
          matchType: s.matchType,
          linkedColdEmailOfferingIds: s.matchedServiceIds,
        }))
      );
    }

    res.status(200).json({
      success: true,
      requestId,
      suggestions,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadOpportunityDictationAnalysis:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
