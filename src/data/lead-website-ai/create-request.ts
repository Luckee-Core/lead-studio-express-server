import { SupabaseClient } from '@supabase/supabase-js';

export type LeadWebsiteAiRequestRow = {
  id: string;
  lead_id: string;
  research_run_id: string | null;
  provider: string;
  model: string;
  request_payload_json: Record<string, unknown>;
  system_prompt: string;
  user_message: string;
  created_at: string;
};

type CreateLeadWebsiteAiRequestInput = {
  leadId: string;
  researchRunId: string | null;
  provider?: string;
  model: string;
  requestPayloadJson: Record<string, unknown>;
  systemPrompt: string;
  userMessage: string;
};

export const createLeadWebsiteAiRequest = async (
  supabase: SupabaseClient,
  input: CreateLeadWebsiteAiRequestInput
): Promise<LeadWebsiteAiRequestRow> => {
  const { data, error } = await supabase
    .from('lead_website_ai_requests')
    .insert({
      lead_id: input.leadId,
      research_run_id: input.researchRunId,
      provider: input.provider ?? 'anthropic',
      model: input.model,
      request_payload_json: input.requestPayloadJson,
      system_prompt: input.systemPrompt,
      user_message: input.userMessage,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_website_ai_request: ${error.message}`);
  }

  return data as LeadWebsiteAiRequestRow;
};
