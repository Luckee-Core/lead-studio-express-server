export type SummarizeDictationNotesRequest = {
  businessName: string;
  address: string | null;
  notes: string;
};

export type DictationOverviewFacts = {
  residential_vs_commercial?: string | null;
  service_area?: string | null;
  years_in_business?: string | null;
  primary_services?: string | null;
  certifications_or_licenses?: string | null;
  team_size?: string | null;
  business_model?: string | null;
};

export type SummarizeDictationNotesResult = {
  success: boolean;
  description: string | null;
  facts: DictationOverviewFacts;
  concerns: string[];
  error?: string;
  rawResponse?: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
  prompts?: { systemPrompt: string; userMessage: string };
};
