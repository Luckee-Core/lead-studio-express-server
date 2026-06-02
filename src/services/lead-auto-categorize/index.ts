import type { Request, Response } from 'express';
import { getLeadById } from '../../data/leads/get-by-id';
import { getAllLeadCategories } from '../../data/lead-categories/get-all';
import { getSupabaseClient } from '../../db/supabase-client';
import { generateCompletion, getManagedAnthropicClient } from '../ai';
import { getModelConfig } from '../ai/model-config';
import { getManualLeadIdFromBody, verifyCronSecret } from '../lead-research-shared';

type AutoCategorizeAIResponse = {
  categoryName?: string;
  confidence?: number;
  reason?: string;
};

const normalizeCategoryName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '');
};

const buildPrompt = (input: {
  businessName: string;
  description: string | null;
  address: string | null;
  website: string | null;
  summary: unknown | null;
  existingCategories: string[];
}): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `
You are categorizing B2B local leads into one lead category.

Rules:
1) Prefer an existing category if it is a reasonable fit.
2) If no existing category fits, propose one concise new category name (2-4 words) that matches the style of existing categories.
3) Default vibe should be local business / service business when info is limited.
4) Return strict JSON only.

Return schema:
{
  "categoryName": "string",
  "confidence": number (0 to 1),
  "reason": "short plain-English reason"
}
`.trim();

  const userMessage = `
Lead:
- Business Name: ${input.businessName}
- Description: ${input.description ?? 'N/A'}
- Address: ${input.address ?? 'N/A'}
- Website: ${input.website ?? 'N/A'}
- At-a-glance summary JSON: ${input.summary ? JSON.stringify(input.summary).slice(0, 1200) : 'N/A'}

Existing categories:
${input.existingCategories.length > 0 ? input.existingCategories.map((name) => `- ${name}`).join('\n') : '- (none)'}

Task:
- Choose the best category for this lead.
- If an existing category matches, use that exact category name.
- If no existing category matches, create one that fits the same naming style.
- Keep confidence realistic.
`.trim();

  return { systemPrompt, userMessage };
};

/**
 * POST /api/services/lead-auto-categorize — manual only.
 *
 * Body must include `leadId`.
 */
export const runLeadAutoCategorize = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const leadId = getManualLeadIdFromBody(req);
  if (!leadId) {
    res.status(400).json({ success: false, error: 'leadId is required' });
    return;
  }

  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  const supabase = getSupabaseClient();

  try {
    const [lead, categories] = await Promise.all([
      getLeadById(supabase, leadId),
      getAllLeadCategories(supabase),
    ]);

    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    const prompt = buildPrompt({
      businessName: lead.business_name,
      description: lead.description,
      address: lead.address,
      website: lead.website,
      summary: lead.summary ?? null,
      existingCategories: categories.map((c) => c.name),
    });

    const modelConfig = getModelConfig('categorization');
    const completion = await generateCompletion(anthropic, {
      systemPrompt: prompt.systemPrompt,
      userMessage: prompt.userMessage,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    let parsed: AutoCategorizeAIResponse | null = null;
    try {
      parsed = JSON.parse(completion.response) as AutoCategorizeAIResponse;
    } catch {
      parsed = null;
    }

    const rawCategoryName = parsed?.categoryName?.trim() || '';
    if (!rawCategoryName) {
      res.status(500).json({
        success: false,
        error: 'Invalid AI response: categoryName missing',
      });
      return;
    }

    const normalized = normalizeCategoryName(rawCategoryName);
    const matchedCategory =
      categories.find((c) => normalizeCategoryName(c.name) === normalized) || null;

    const confidenceRaw = typeof parsed?.confidence === 'number' ? parsed.confidence : 0.5;
    const confidence = Math.max(0, Math.min(1, confidenceRaw));
    const categoryName = matchedCategory ? matchedCategory.name : rawCategoryName;

    res.status(200).json({
      success: true,
      leadId,
      categoryName,
      matchedExisting: Boolean(matchedCategory),
      matchedCategoryId: matchedCategory?.id ?? null,
      confidence,
      reason: parsed?.reason?.trim() || 'Matched from lead description and business context.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ runLeadAutoCategorize:', message);
    res.status(500).json({ success: false, error: message });
  }
};
