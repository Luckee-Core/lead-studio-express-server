import { SupabaseClient } from '@supabase/supabase-js';

export type LeadGoogleSearchAiRequestRow = {
  id: string;
  lead_id: string;
  research_run_id: string | null;
  facebook_google_search_run_id: string | null;
  provider: string;
  model: string;
  request_payload_json: Record<string, unknown>;
  system_prompt: string;
  user_message: string;
  created_at: string;
};

type CreateLeadGoogleSearchAiRequestInput = {
  leadId: string;
  /** Set for Instagram/LinkedIn runs (FK to lead_google_search_research). */
  researchRunId?: string | null;
  /** Set for Facebook runs (FK to facebook_google_search). */
  facebookGoogleSearchRunId?: string | null;
  provider?: string;
  model: string;
  requestPayloadJson: Record<string, unknown>;
  systemPrompt: string;
  userMessage: string;
};

export const createLeadGoogleSearchAiRequest = async (
  supabase: SupabaseClient,
  input: CreateLeadGoogleSearchAiRequestInput
): Promise<LeadGoogleSearchAiRequestRow> => {
  if (!input.researchRunId && !input.facebookGoogleSearchRunId) {
    throw new Error(
      'createLeadGoogleSearchAiRequest: researchRunId or facebookGoogleSearchRunId is required'
    );
  }
  const { data, error } = await supabase
    .from('lead_google_search_ai_requests')
    .insert({
      lead_id: input.leadId,
      research_run_id: input.researchRunId ?? null,
      facebook_google_search_run_id: input.facebookGoogleSearchRunId ?? null,
      provider: input.provider ?? 'anthropic',
      model: input.model,
      request_payload_json: input.requestPayloadJson,
      system_prompt: input.systemPrompt,
      user_message: input.userMessage,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_google_search_ai_request: ${error.message}`);
  }

  return data as LeadGoogleSearchAiRequestRow;
};
