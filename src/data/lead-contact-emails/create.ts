/**
 * Create Lead Contact Email
 * Creates a new lead contact email
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmail } from './get-all';

export interface CreateLeadContactEmailInput {
  lead_id: string;
  lead_contact_id: string;
  subject: string;
  body: Record<string, any>;
  campaign_ids?: string[];
  variation_id?: number;
  email_sending_identity_id?: string | null;
}

export const createLeadContactEmail = async (
  supabase: SupabaseClient,
  input: CreateLeadContactEmailInput
): Promise<LeadContactEmail> => {
  const { data, error } = await supabase
    .from('lead_contact_emails')
    .insert({
      ...input,
      campaign_ids: input.campaign_ids ?? [],
      variation_id: input.variation_id ?? null,
      email_sending_identity_id: input.email_sending_identity_id ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead contact email: ${error.message}`);
  }

  return data;
};
