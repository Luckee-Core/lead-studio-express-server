import { SupabaseClient } from '@supabase/supabase-js';

export type LeadDictationNotesAiResponseRow = {
  id: string;
  request_id: string;
  model: string;
  status: 'success' | 'error';
  raw_response: string | null;
  parsed_response_json: Record<string, unknown> | null;
  error_message: string | null;
  usage_input_tokens: number | null;
  usage_output_tokens: number | null;
  created_at: string;
};

type CreateLeadDictationNotesAiResponseInput = {
  requestId: string;
  model: string;
  status: 'success' | 'error';
  rawResponse?: string | null;
  parsedResponseJson?: Record<string, unknown> | null;
  errorMessage?: string | null;
  usageInputTokens?: number | null;
  usageOutputTokens?: number | null;
};

export const createLeadDictationNotesAiResponse = async (
  supabase: SupabaseClient,
  input: CreateLeadDictationNotesAiResponseInput
): Promise<LeadDictationNotesAiResponseRow> => {
  const { data, error } = await supabase
    .from('lead_dictation_notes_ai_responses')
    .insert({
      request_id: input.requestId,
      model: input.model,
      status: input.status,
      raw_response: input.rawResponse ?? null,
      parsed_response_json: input.parsedResponseJson ?? null,
      error_message: input.errorMessage ?? null,
      usage_input_tokens: input.usageInputTokens ?? null,
      usage_output_tokens: input.usageOutputTokens ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_dictation_notes_ai_response: ${error.message}`);
  }

  return data as LeadDictationNotesAiResponseRow;
};
