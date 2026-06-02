/**
 * Delete Lead Contact Email
 * Deletes a lead contact email by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteLeadContactEmail = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('lead_contact_emails')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lead contact email: ${error.message}`);
  }
};
