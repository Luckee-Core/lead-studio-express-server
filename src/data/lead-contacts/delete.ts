/**
 * Delete Lead Contact
 * Deletes a lead contact by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteLeadContact = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase.from('lead_contacts').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lead contact: ${error.message}`);
  }
};
