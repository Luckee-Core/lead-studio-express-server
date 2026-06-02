import { SupabaseClient } from '@supabase/supabase-js';

export type LeadDictationNotesAiRequestRow = {
  id: string;
  lead_id: string;
  provider: string;
  model: string;
  request_payload_json: Record<string, unknown>;
  system_prompt: string;
  user_message: string;
  created_at: string;
};

type CreateLeadDictationNotesAiRequestInput = {
  leadId: string;
  provider?: string;
  model: string;
  requestPayloadJson: Record<string, unknown>;
  systemPrompt: string;
  userMessage: string;
};

export const createLeadDictationNotesAiRequest = async (
  supabase: SupabaseClient,
  input: CreateLeadDictationNotesAiRequestInput
): Promise<LeadDictationNotesAiRequestRow> => {
  const { data, error } = await supabase
    .from('lead_dictation_notes_ai_requests')
    .insert({
      lead_id: input.leadId,
      provider: input.provider ?? 'anthropic',
      model: input.model,
      request_payload_json: input.requestPayloadJson,
      system_prompt: input.systemPrompt,
      user_message: input.userMessage,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_dictation_notes_ai_request: ${error.message}`);
  }

  return data as LeadDictationNotesAiRequestRow;
};
