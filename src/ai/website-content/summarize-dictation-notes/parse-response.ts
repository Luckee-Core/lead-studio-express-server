import type {
  DictationOverviewFacts,
  SummarizeDictationNotesResult,
} from './types';

const stripCodeFences = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
  return text.trim();
};

const asStringArray = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
};

const FACT_KEYS: (keyof DictationOverviewFacts)[] = [
  'residential_vs_commercial',
  'service_area',
  'years_in_business',
  'primary_services',
  'certifications_or_licenses',
  'team_size',
  'business_model',
];

const parseFacts = (raw: unknown): DictationOverviewFacts => {
  if (typeof raw !== 'object' || raw === null) return {};
  const o = raw as Record<string, unknown>;
  const out: DictationOverviewFacts = {};
  for (const key of FACT_KEYS) {
    const value = o[key as string];
    if (typeof value === 'string' && value.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
};

const emptyError = (error: string): SummarizeDictationNotesResult => ({
  success: false,
  description: null,
  facts: {},
  concerns: [],
  error,
  model: '',
});

export const parseSummarizeDictationNotesResponse = (
  aiResponse: string
): SummarizeDictationNotesResult => {
  try {
    const text = stripCodeFences(aiResponse);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const rawQuick =
      parsed.quick_take ??
      parsed.quickTake ??
      parsed.description ??
      parsed.businessDescription ??
      parsed.overview;

    if (typeof rawQuick !== 'string' || !rawQuick.trim()) {
      return emptyError('Missing or invalid quick_take / description in JSON');
    }

    return {
      success: true,
      description: rawQuick.trim(),
      facts: parseFacts(parsed.facts),
      concerns: asStringArray(parsed.concerns),
      model: '',
    };
  } catch (error) {
    return emptyError(error instanceof Error ? error.message : 'Failed to parse JSON');
  }
};
