import type {
  OpportunityCandidate,
  SummarizeOpportunityDictationResult,
} from './types';

const stripCodeFences = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
  return text.trim();
};

const parseLinkedIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string' && entry.trim()) {
      out.push(entry.trim());
    }
  }
  return out;
};

const parseOpportunities = (value: unknown): OpportunityCandidate[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : '',
      description: typeof item.description === 'string' ? item.description.trim() : '',
      reason: typeof item.reason === 'string' ? item.reason.trim() : '',
      linkedServiceIds: parseLinkedIds(item.linkedServiceIds),
    }))
    .filter((item) => item.title && item.description && item.reason)
    .slice(0, 6);
};

export const parseSummarizeOpportunityDictationResponse = (
  aiResponse: string
): SummarizeOpportunityDictationResult => {
  try {
    const parsed = JSON.parse(stripCodeFences(aiResponse)) as Record<string, unknown>;
    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Opportunity suggestions generated from dictation notes.';
    return {
      success: true,
      summary,
      opportunities: parseOpportunities(parsed.opportunities),
      model: '',
    };
  } catch (error) {
    return {
      success: false,
      summary: '',
      opportunities: [],
      error: error instanceof Error ? error.message : 'Failed to parse JSON',
      model: '',
    };
  }
};
