/**
 * Get Lead Contacts By IDs
 * Retrieves multiple lead contacts by their IDs
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContact } from './get-by-lead-id';

const CONTACT_IDS_CHUNK_SIZE = 100;

export type GetLeadContactsByIdsOptions = {
  /** When true (default), omits contacts without an email address. */
  requireEmail?: boolean;
};

/**
 * Fetches lead contacts for many ids in bounded batches to avoid connection exhaustion.
 */
export const getLeadContactsByIds = async (
  supabase: SupabaseClient,
  ids: string[],
  options?: GetLeadContactsByIdsOptions,
): Promise<LeadContact[]> => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const contacts: LeadContact[] = [];
  for (let i = 0; i < uniqueIds.length; i += CONTACT_IDS_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CONTACT_IDS_CHUNK_SIZE);
    const { data, error } = await supabase
      .from('lead_contacts')
      .select('*')
      .in('id', chunk)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch lead contacts by IDs: ${error.message}`);
    }

    contacts.push(...(data || []));
  }

  if (options?.requireEmail === false) {
    return contacts;
  }

  return contacts.filter((contact) => contact.email && contact.email.trim() !== '');
};
