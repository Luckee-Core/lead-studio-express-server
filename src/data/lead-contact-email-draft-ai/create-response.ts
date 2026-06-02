import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactEmailDraftAiResponseRow = {
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

type CreateLeadContactEmailDraftAiResponseInput = {
  requestId: string;
  model: string;
  status: 'success' | 'error';
  rawResponse?: string | null;
  parsedResponseJson?: Record<string, unknown> | null;
  errorMessage?: string | null;
  usageInputTokens?: number | null;
  usageOutputTokens?: number | null;
};

/**
 * Inserts a lead contact email draft AI response row (raw output, parse snapshot, usage).
 */
export const createLeadContactEmailDraftAiResponse = async (
  supabase: SupabaseClient,
  input: CreateLeadContactEmailDraftAiResponseInput,
): Promise<LeadContactEmailDraftAiResponseRow> => {
  const { data, error } = await supabase
    .from('lead_contact_email_draft_ai_responses')
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
    throw new Error(`Failed to create lead_contact_email_draft_ai_response: ${error.message}`);
  }

  return data as LeadContactEmailDraftAiResponseRow;
};
