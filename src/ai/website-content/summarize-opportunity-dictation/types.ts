export type SummarizeOpportunityDictationRequest = {
  businessName: string;
  address: string | null;
  notes: string;
  existingServices: {
    id: string;
    title: string;
    description: string;
  }[];
};

export type OpportunityCandidate = {
  title: string;
  description: string;
  reason: string;
  /** Catalog service UUIDs from the provided list; omit or [] for net-new opportunities. */
  linkedServiceIds: string[];
};

export type SummarizeOpportunityDictationResult = {
  success: boolean;
  summary: string;
  opportunities: OpportunityCandidate[];
  error?: string;
  rawResponse?: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
  prompts?: { systemPrompt: string; userMessage: string };
};
