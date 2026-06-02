import { SupabaseClient } from '@supabase/supabase-js';

export type LeadFacebookPostsAiRequestRow = {
  id: string;
  lead_id: string;
  posts_research_run_id: string | null;
  provider: string;
  model: string;
  request_payload_json: Record<string, unknown>;
  system_prompt: string;
  user_message: string;
  created_at: string;
};

type CreateLeadFacebookPostsAiRequestInput = {
  leadId: string;
  postsResearchRunId: string | null;
  provider?: string;
  model: string;
  requestPayloadJson: Record<string, unknown>;
  systemPrompt: string;
  userMessage: string;
};

/**
 * Inserts a Facebook posts AI request row (prompts + payload snapshot).
 */
export const createLeadFacebookPostsAiRequest = async (
  supabase: SupabaseClient,
  input: CreateLeadFacebookPostsAiRequestInput,
): Promise<LeadFacebookPostsAiRequestRow> => {
  const { data, error } = await supabase
    .from('lead_facebook_posts_ai_requests')
    .insert({
      lead_id: input.leadId,
      posts_research_run_id: input.postsResearchRunId,
      provider: input.provider ?? 'anthropic',
      model: input.model,
      request_payload_json: input.requestPayloadJson,
      system_prompt: input.systemPrompt,
      user_message: input.userMessage,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_facebook_posts_ai_request: ${error.message}`);
  }

  return data as LeadFacebookPostsAiRequestRow;
};
