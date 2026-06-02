/**
 * Create Lead Sent Email
 * Creates a new lead sent email record
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadSentEmail } from './get-all';

export interface CreateLeadSentEmailInput {
  lead_email_id: string;
  lead_contact_id: string;
  persona_id?: string | null;
  campaign_id?: string | null;
  campaign_email_variation_id?: string | null;
  status?: 'sent' | 'responded_won' | 'responded_lost' | 'not_responded';
  sent_at?: string;
  from_name?: string | null;
  from_email?: string | null;
  email_sending_identity_id?: string | null;
  variation_id?: number | null;
  sg_message_id?: string | null;
  open_tracking_token?: string | null;
}

export const createLeadSentEmail = async (
  supabase: SupabaseClient,
  input: CreateLeadSentEmailInput
): Promise<LeadSentEmail> => {
  const { data, error } = await supabase
    .from('lead_sent_emails')
    .insert({
      ...input,
      persona_id: input.persona_id ?? null,
      campaign_id: input.campaign_id ?? null,
      campaign_email_variation_id: input.campaign_email_variation_id ?? null,
      status: input.status ?? 'sent',
      sent_at: input.sent_at ?? new Date().toISOString(),
      from_name: input.from_name ?? null,
      from_email: input.from_email ?? null,
      email_sending_identity_id: input.email_sending_identity_id ?? null,
      variation_id: input.variation_id ?? null,
      sg_message_id: input.sg_message_id ?? null,
      open_tracking_token: input.open_tracking_token ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead sent email: ${error.message}`);
  }

  return data;
};
