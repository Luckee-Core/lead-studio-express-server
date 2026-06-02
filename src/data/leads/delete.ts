/**
 * Delete Lead
 * Deletes a lead by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteLead = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase.from('leads').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lead: ${error.message}`);
  }
};
