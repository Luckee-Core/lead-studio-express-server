import { SupabaseClient } from '@supabase/supabase-js';

export type LeadDictationNotesAiExchangeRow = {
  id: string;
  lead_id: string;
  request_id: string;
  response_id: string;
  created_at: string;
};

type CreateLeadDictationNotesAiExchangeInput = {
  leadId: string;
  requestId: string;
  responseId: string;
};

export const createLeadDictationNotesAiExchange = async (
  supabase: SupabaseClient,
  input: CreateLeadDictationNotesAiExchangeInput
): Promise<LeadDictationNotesAiExchangeRow> => {
  const { data, error } = await supabase
    .from('lead_dictation_notes_ai_exchanges')
    .insert({
      lead_id: input.leadId,
      request_id: input.requestId,
      response_id: input.responseId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_dictation_notes_ai_exchange: ${error.message}`);
  }

  return data as LeadDictationNotesAiExchangeRow;
};
