/**
 * Get All Lead Contacts
 * Fetches all lead contacts ordered by created_at descending
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContact } from './get-by-lead-id';

export const getAllLeadContacts = async (
  supabase: SupabaseClient
): Promise<LeadContact[]> => {
  const { data, error } = await supabase
    .from('lead_contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead contacts: ${error.message}`);
  }

  return data || [];
};
