/**
 * Update Lead Contact
 * Updates an existing lead contact
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContact } from './get-by-lead-id';

export type UpdateLeadContactInput = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
  status?: string;
};

export const updateLeadContact = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateLeadContactInput
): Promise<LeadContact> => {
  const { data, error } = await supabase
    .from('lead_contacts')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead contact: ${error.message}`);
  }

  return data;
};
