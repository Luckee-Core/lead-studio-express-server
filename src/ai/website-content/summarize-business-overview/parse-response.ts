import type { SummarizeBusinessOverviewResult, WebsiteOverviewFacts } from './types';

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

const FACT_KEYS: (keyof WebsiteOverviewFacts)[] = [
  'residential_vs_commercial',
  'service_area',
  'years_in_business',
  'primary_services',
  'certifications_or_licenses',
  'team_size',
  'business_model',
];

const parseFacts = (raw: unknown): WebsiteOverviewFacts => {
  if (typeof raw !== 'object' || raw === null) return {};
  const o = raw as Record<string, unknown>;
  const out: WebsiteOverviewFacts = {};
  for (const k of FACT_KEYS) {
    const v = o[k as string];
    if (typeof v === 'string' && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
};

const MAX_QUICK_TAKE_CHARS = 2000;

const emptyError = (
  error: string
): SummarizeBusinessOverviewResult => ({
  success: false,
  description: null,
  facts: {},
  concerns: [],
  error,
  model: '',
});

/**
 * Parse JSON: quick_take (or legacy description) + facts object + concerns.
 */
export const parseSummarizeBusinessOverviewResponse = (
  aiResponse: string
): SummarizeBusinessOverviewResult => {
  try {
    const text = stripCodeFences(aiResponse);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const rawQuick =
      parsed.quick_take ??
      parsed.quickTake ??
      parsed.description ??
      parsed.businessDescription ??
      parsed.overview;
    if (typeof rawQuick !== 'string') {
      return emptyError('Missing or invalid quick_take / description in JSON');
    }
    let description = rawQuick.trim();
    if (!description) {
      return emptyError('Empty quick_take');
    }
    if (description.length > MAX_QUICK_TAKE_CHARS) {
      description = `${description.slice(0, MAX_QUICK_TAKE_CHARS).trim()}…`;
    }

    const facts = parseFacts(parsed.facts);
    const concerns = asStringArray(parsed.concerns);

    return {
      success: true,
      description,
      facts,
      concerns,
      model: '',
    };
  } catch (e) {
    return {
      success: false,
      description: null,
      facts: {},
      concerns: [],
      error: e instanceof Error ? e.message : 'Failed to parse JSON',
      model: '',
    };
  }
};
