/**
 * Get Lead Contacts By IDs
 * Retrieves multiple lead contacts by their IDs
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContact } from './get-by-lead-id';

export const getLeadContactsByIds = async (
  supabase: SupabaseClient,
  ids: string[]
): Promise<LeadContact[]> => {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('lead_contacts')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch lead contacts by IDs: ${error.message}`);
  }

  // Filter out contacts without email addresses
  return (data || []).filter((contact) => contact.email && contact.email.trim() !== '');
};
