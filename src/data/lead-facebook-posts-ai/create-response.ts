import { SupabaseClient } from '@supabase/supabase-js';

export type LeadFacebookPostsAiResponseRow = {
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

type CreateLeadFacebookPostsAiResponseInput = {
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
 * Inserts a Facebook posts AI response row (raw output, parse snapshot, usage).
 */
export const createLeadFacebookPostsAiResponse = async (
  supabase: SupabaseClient,
  input: CreateLeadFacebookPostsAiResponseInput,
): Promise<LeadFacebookPostsAiResponseRow> => {
  const { data, error } = await supabase
    .from('lead_facebook_posts_ai_responses')
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
    throw new Error(`Failed to create lead_facebook_posts_ai_response: ${error.message}`);
  }

  return data as LeadFacebookPostsAiResponseRow;
};
