/**
 * Get Lead Contacts by Lead ID
 * Fetches all contacts for a given lead
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContact = {
  id: string;
  lead_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export const getLeadContactsByLeadId = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadContact[]> => {
  const { data, error } = await supabase
    .from('lead_contacts')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead contacts: ${error.message}`);
  }

  return data || [];
};
