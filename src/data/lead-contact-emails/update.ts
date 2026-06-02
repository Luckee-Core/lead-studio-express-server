/**
 * Update Lead Contact Email
 * Updates an existing lead contact email
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmail } from './get-all';

export interface UpdateLeadContactEmailInput {
  subject?: string;
  body?: Record<string, any>;
  campaign_ids?: string[];
  email_sending_identity_id?: string | null;
}

export const updateLeadContactEmail = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateLeadContactEmailInput
): Promise<LeadContactEmail> => {
  const { data, error } = await supabase
    .from('lead_contact_emails')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead contact email: ${error.message}`);
  }

  return data;
};
