import { SupabaseClient } from '@supabase/supabase-js';

export type LeadFacebookPostsAiExchangeRow = {
  id: string;
  lead_id: string;
  posts_research_run_id: string | null;
  request_id: string;
  response_id: string;
  created_at: string;
};

type CreateLeadFacebookPostsAiExchangeInput = {
  leadId: string;
  postsResearchRunId: string | null;
  requestId: string;
  responseId: string;
};

/**
 * Links a Facebook posts AI request/response to a lead (and optional research run).
 */
export const createLeadFacebookPostsAiExchange = async (
  supabase: SupabaseClient,
  input: CreateLeadFacebookPostsAiExchangeInput,
): Promise<LeadFacebookPostsAiExchangeRow> => {
  const { data, error } = await supabase
    .from('lead_facebook_posts_ai_exchanges')
    .insert({
      lead_id: input.leadId,
      posts_research_run_id: input.postsResearchRunId,
      request_id: input.requestId,
      response_id: input.responseId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_facebook_posts_ai_exchange: ${error.message}`);
  }

  return data as LeadFacebookPostsAiExchangeRow;
};
