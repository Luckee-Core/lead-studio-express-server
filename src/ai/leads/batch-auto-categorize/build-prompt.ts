import type { BatchAutoCategorizeCategoryInput, BatchAutoCategorizeLeadInput } from './types';

const SUMMARY_MAX_CHARS = 1200;

/**
 * Build system + user messages for batch lead categorization (existing categories only or null).
 */
export const buildBatchAutoCategorizePrompt = (input: {
  categories: BatchAutoCategorizeCategoryInput[];
  leads: BatchAutoCategorizeLeadInput[];
}): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `
You assign each lead to at most one existing lead category, or null if none fit.

Rules:
1) For every lead id in the user message, output exactly one assignment object with that leadId.
2) categoryId must be one of the provided category ids (exact string match) or JSON null if no category is a reasonable fit.
3) Do not invent category ids or names. Do not output categories that were not listed.
4) Return strict JSON only — no markdown fences, no commentary.

Return schema:
{
  "assignments": [
    { "leadId": "<uuid>", "categoryId": "<uuid>" | null }
  ]
}
`.trim();

  const categoriesBlock = input.categories
    .map(
      (c) =>
        `- id: ${c.id}\n  name: ${c.name}${
          c.normalized_name ? `\n  normalized_name: ${c.normalized_name}` : ''
        }`
    )
    .join('\n');

  const leadsBlock = input.leads
    .map((lead) => {
      const summaryStr =
        lead.summary != null
          ? JSON.stringify(lead.summary).slice(0, SUMMARY_MAX_CHARS)
          : 'null';
      return [
        `Lead id: ${lead.id}`,
        `  business_name: ${lead.business_name}`,
        `  description: ${lead.description ?? 'null'}`,
        `  website: ${lead.website ?? 'null'}`,
        `  address: ${lead.address ?? 'null'}`,
        `  summary (truncated JSON): ${summaryStr}`,
      ].join('\n');
    })
    .join('\n\n');

  const userMessage = `
Categories (use only these ids or null):
${categoriesBlock || '(none — then every categoryId must be null)'}

Leads to categorize:
${leadsBlock}

Respond with JSON only: { "assignments": [ ... ] } including every lead id above exactly once.
`.trim();

  return { systemPrompt, userMessage };
};
