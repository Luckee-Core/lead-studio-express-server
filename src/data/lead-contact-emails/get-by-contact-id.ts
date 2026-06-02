/**
 * Get Lead Contact Emails By Contact ID
 * Retrieves all emails for a specific lead contact
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmail } from './get-all';

export const getLeadContactEmailsByContactId = async (
  supabase: SupabaseClient,
  contactId: string
): Promise<LeadContactEmail[]> => {
  const { data, error } = await supabase
    .from('lead_contact_emails')
    .select('*')
    .eq('lead_contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead contact emails: ${error.message}`);
  }

  return data || [];
};
