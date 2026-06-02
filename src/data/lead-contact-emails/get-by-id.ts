/**
 * Get Lead Contact Email By ID
 * Retrieves a single lead contact email by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmail } from './get-all';

export const getLeadContactEmailById = async (
  supabase: SupabaseClient,
  id: string
): Promise<LeadContactEmail | null> => {
  const { data, error } = await supabase
    .from('lead_contact_emails')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch lead contact email: ${error.message}`);
  }

  return data;
};
