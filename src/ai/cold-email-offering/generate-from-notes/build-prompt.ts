import type { GenerateColdEmailOfferingFromNotesRequest } from './types';

const MAX_NOTES_CHARS = 20_000;

const truncate = (s: string, max: number): string => {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[…truncated…]`;
};

/**
 * Build prompts to turn freeform notes into an outcome-focused cold email offering.
 */
export const buildGenerateColdEmailOfferingFromNotesPrompt = (
  request: GenerateColdEmailOfferingFromNotesRequest,
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You help freelancers and consultants define cold-email outreach angles for local businesses (dental offices, HVAC, real estate, insurance brokers, etc.).

Audience: Non-technical business owners who care about outcomes, not AI jargon.

Output:
Return ONLY valid JSON. No markdown fences, no text before or after.

Required keys:
- title: string — Short outcome headline (e.g. "Faster lead response", "Fewer no-shows"). Under 60 chars.
- hook: string — One-line pitch the sender can use in outreach (e.g. "Your leads get a personalized reply in under 90 seconds, 24/7"). Under 140 chars. No mention of AI, GPT, Zapier, or automation tools.
- description: string — 2-4 sentences expanding the outcome: pain solved, measurable benefit, who it's for. Plain language. No tech stack.

Rules:
1) Sell the outcome, not the technology.
2) Focus on speed, saved hours, follow-up rate, lost leads, manual work — not "workflows" or "integrations".
3) Ground in the user's notes; do not invent pricing or guarantees.
4) Tone: direct, credible, boring-business friendly.`;

  const notes = truncate(request.sourceNotes.trim(), MAX_NOTES_CHARS);
  const userMessage = [
    'Freeform notes about what I sell or want to pitch to local businesses:',
    notes || '(none provided — infer a generic local-business outreach angle)',
  ].join('\n');

  return { systemPrompt, userMessage };
};
