import type { SummarizeDictationNotesRequest } from './types';

const MAX_NOTES_CHARS = 60_000;

const truncate = (s: string, max: number): string => {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[…truncated…]`;
};

export const buildSummarizeDictationNotesPrompt = (
  request: SummarizeDictationNotesRequest
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You analyze small-business research notes and return JSON for a CRM.

Audience: Busy owners and reps. Use plain language.

Output:
Return ONLY valid JSON. No markdown fences, no text before or after.

Required keys:
- quick_take: string — Exactly 2-3 sentences (under ~450 characters). What they do, who they serve, and one differentiator if clear.
- facts: object — Short string values for:
  - residential_vs_commercial
  - business_model
  - primary_services
  - service_area
  - years_in_business
  - team_size
  - certifications_or_licenses
- concerns: string[] — 0-4 optional watchouts based on the notes.

Rules:
1) Grounding: infer only from the provided notes; do not invent concrete details.
2) Use "Unknown" for missing facts.
3) Keep fact values short (typically < 120 chars).
4) Do not include opportunities/highlights fields.`;

  const notes = truncate(request.notes.trim(), MAX_NOTES_CHARS);
  const userMessage = [
    `Business name (from CRM): ${request.businessName.trim() || '(unknown)'}`,
    request.address?.trim()
      ? `Address (from CRM): ${request.address.trim()}`
      : 'Address (from CRM): (none)',
    '',
    'Voice dictation / manual notes:',
    notes || '(none provided)',
  ].join('\n');

  return { systemPrompt, userMessage };
};
