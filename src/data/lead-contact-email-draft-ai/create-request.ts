import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactEmailDraftAiRequestRow = {
  id: string;
  lead_id: string;
  lead_contact_id: string;
  provider: string;
  model: string;
  request_payload_json: Record<string, unknown>;
  system_prompt: string;
  user_message: string;
  created_at: string;
};

type CreateLeadContactEmailDraftAiRequestInput = {
  leadId: string;
  leadContactId: string;
  provider?: string;
  model: string;
  requestPayloadJson: Record<string, unknown>;
  systemPrompt: string;
  userMessage: string;
};

/**
 * Inserts a lead contact email draft AI request row (prompts + payload snapshot).
 */
export const createLeadContactEmailDraftAiRequest = async (
  supabase: SupabaseClient,
  input: CreateLeadContactEmailDraftAiRequestInput,
): Promise<LeadContactEmailDraftAiRequestRow> => {
  const { data, error } = await supabase
    .from('lead_contact_email_draft_ai_requests')
    .insert({
      lead_id: input.leadId,
      lead_contact_id: input.leadContactId,
      provider: input.provider ?? 'anthropic',
      model: input.model,
      request_payload_json: input.requestPayloadJson,
      system_prompt: input.systemPrompt,
      user_message: input.userMessage,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead_contact_email_draft_ai_request: ${error.message}`);
  }

  return data as LeadContactEmailDraftAiRequestRow;
};
