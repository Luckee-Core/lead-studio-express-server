/**
 * Get Lead Contact by ID
 * Fetches a single contact by id (for enrichment, e.g. lead_sent_emails).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContact } from './get-by-lead-id';

export const getLeadContactById = async (
  supabase: SupabaseClient,
  contactId: string
): Promise<LeadContact | null> => {
  const { data, error } = await supabase
    .from('lead_contacts')
    .select('*')
    .eq('id', contactId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch lead contact: ${error.message}`);
  }

  return data;
};
