import type { SummarizeOpportunityDictationRequest } from './types';

const MAX_NOTES_CHARS = 60_000;
const MAX_SERVICES = 30;

const truncate = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[…truncated…]`;
};

export const buildSummarizeOpportunityDictationPrompt = (
  request: SummarizeOpportunityDictationRequest
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You extract actionable lead-specific sales opportunities from research notes.

Output format:
Return ONLY valid JSON with:
- summary: string (1-2 sentences)
- opportunities: array (0-6) of objects:
  - title: short label for this lead (may echo a core service name but should feel specific to this business)
  - description: what would be delivered for THIS lead (lead-specific, not generic catalog copy)
  - reason: why this opportunity fits THIS lead, grounded in the notes
  - linkedServiceIds: string array of UUIDs from the "Core services" list below. Include every catalog service that substantively applies (one or more). Use [] only when nothing in the catalog fits and you are proposing a genuinely new offering.

Rules:
1) Do not invent company-specific facts not present in the notes.
2) When a catalog service applies, you MUST copy its id exactly into linkedServiceIds and still write title/description/reason tailored to this lead.
3) Prefer reusing catalog services via linkedServiceIds over inventing parallel offerings.
4) Use linkedServiceIds: [] only when no reasonable catalog match exists; then propose a net-new opportunity.
5) If notes are vague, return fewer opportunities.
6) No markdown, no prose outside JSON.`;

  const existingServicesSection =
    request.existingServices.length > 0
      ? [
          'Core services (id | title — description). Use these ids in linkedServiceIds:',
          ...request.existingServices.slice(0, MAX_SERVICES).map(
            (service) =>
              `${service.id} | ${service.title.trim() || '(untitled)'} — ${service.description.trim() || '(no description)'}`
          ),
        ].join('\n')
      : 'Core services: (none — use linkedServiceIds: [] for any proposal)';

  const userMessage = [
    `Business name: ${request.businessName.trim() || '(unknown)'}`,
    request.address?.trim() ? `Address: ${request.address.trim()}` : 'Address: (none)',
    '',
    existingServicesSection,
    '',
    'Dictation notes:',
    truncate(request.notes.trim(), MAX_NOTES_CHARS),
  ].join('\n');

  return { systemPrompt, userMessage };
};
