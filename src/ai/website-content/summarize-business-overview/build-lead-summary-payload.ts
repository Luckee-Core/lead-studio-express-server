import type { SummarizeBusinessOverviewResult } from './types';

/**
 * Maps AI parse output to `leads.summary` JSON (matches luckee-web `LeadSummary`).
 */
export const buildLeadSummaryFromWebsiteOverviewAi = (
  ai: Pick<SummarizeBusinessOverviewResult, 'description' | 'facts' | 'concerns'>,
  scrapesCount: number
): {
  content: string;
  highlights: string[];
  opportunities: string[];
  facts: NonNullable<SummarizeBusinessOverviewResult['facts']>;
  concerns: string[];
  generated_at: string;
  source_data: { notes_count: number; scrapes_count: number };
} => {
  const content = (ai.description ?? '').trim();
  return {
    content,
    highlights: [],
    opportunities: [],
    facts: ai.facts ?? {},
    concerns: ai.concerns ?? [],
    generated_at: new Date().toISOString(),
    source_data: {
      notes_count: 0,
      scrapes_count: scrapesCount,
    },
  };
};
