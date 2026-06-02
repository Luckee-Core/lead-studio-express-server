import { SupabaseClient } from '@supabase/supabase-js';

export type LeadGoogleSearchAiExchangeRow = {
  id: string;
  lead_id: string;
  research_run_id: string | null;
  facebook_google_search_run_id: string | null;
  request_id: string;
  response_id: string;
  created_at: string;
};

type CreateLeadGoogleSearchAiExchangeInput = {
  leadId: string;
  researchRunId?: string | null;
  facebookGoogleSearchRunId?: string | null;
  requestId: string;
  responseId: string;
};

export const createLeadGoogleSearchAiExchange = async (
  supabase: SupabaseClient,
  input: CreateLeadGoogleSearchAiExchangeInput
): Promise<LeadGoogleSearchAiExchangeRow> => {
  if (!input.researchRunId && !input.facebookGoogleSearchRunId) {
    throw new Error(
      'createLeadGoogleSearchAiExchange: researchRunId or facebookGoogleSearchRunId is required'
    );
  }
  const { data, error } = await supabase
    .from('lead_google_search_ai_exchanges')
    .insert({
      lead_id: input.leadId,
      research_run_id: input.researchRunId ?? null,
      facebook_google_search_run_id: input.facebookGoogleSearchRunId ?? null,
      request_id: input.requestId,
      response_id: input.responseId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_google_search_ai_exchange: ${error.message}`);
  }

  return data as LeadGoogleSearchAiExchangeRow;
};
