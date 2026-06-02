import type { WebsiteContentPage } from '../../../domains/website-content/processWebsiteContentCrawl';

export type SummarizeBusinessOverviewRequest = {
  businessName: string;
  address: string | null;
  pages: WebsiteContentPage[];
};

/** Labeled extraction for `leads.summary.facts` (matches luckee-web `LeadSummaryWebsiteFacts`). */
export type WebsiteOverviewFacts = {
  residential_vs_commercial?: string | null;
  service_area?: string | null;
  years_in_business?: string | null;
  primary_services?: string | null;
  certifications_or_licenses?: string | null;
  team_size?: string | null;
  business_model?: string | null;
};

/** Parsed website AI output; `description` is the short CRM blurb (same as quick_take). */
export type SummarizeBusinessOverviewResult = {
  success: boolean;
  description: string | null;
  facts: WebsiteOverviewFacts;
  concerns: string[];
  error?: string;
  rawResponse?: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
  prompts?: { systemPrompt: string; userMessage: string };
};
