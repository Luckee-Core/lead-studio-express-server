import { SupabaseClient } from '@supabase/supabase-js';

export type LeadWebsiteAiExchangeRow = {
  id: string;
  lead_id: string;
  research_run_id: string | null;
  request_id: string;
  response_id: string;
  created_at: string;
};

type CreateLeadWebsiteAiExchangeInput = {
  leadId: string;
  researchRunId: string | null;
  requestId: string;
  responseId: string;
};

export const createLeadWebsiteAiExchange = async (
  supabase: SupabaseClient,
  input: CreateLeadWebsiteAiExchangeInput
): Promise<LeadWebsiteAiExchangeRow> => {
  const { data, error } = await supabase
    .from('lead_website_ai_exchanges')
    .insert({
      lead_id: input.leadId,
      research_run_id: input.researchRunId,
      request_id: input.requestId,
      response_id: input.responseId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_website_ai_exchange: ${error.message}`);
  }

  return data as LeadWebsiteAiExchangeRow;
};
