import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactEmailDraftAiExchangeRow = {
  id: string;
  lead_id: string;
  lead_contact_id: string;
  request_id: string;
  response_id: string;
  created_at: string;
};

type CreateLeadContactEmailDraftAiExchangeInput = {
  leadId: string;
  leadContactId: string;
  requestId: string;
  responseId: string;
};

/**
 * Links a lead contact email draft AI request/response to a lead and contact.
 */
export const createLeadContactEmailDraftAiExchange = async (
  supabase: SupabaseClient,
  input: CreateLeadContactEmailDraftAiExchangeInput,
): Promise<LeadContactEmailDraftAiExchangeRow> => {
  const { data, error } = await supabase
    .from('lead_contact_email_draft_ai_exchanges')
    .insert({
      lead_id: input.leadId,
      lead_contact_id: input.leadContactId,
      request_id: input.requestId,
      response_id: input.responseId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_contact_email_draft_ai_exchange: ${error.message}`);
  }

  return data as LeadContactEmailDraftAiExchangeRow;
};
