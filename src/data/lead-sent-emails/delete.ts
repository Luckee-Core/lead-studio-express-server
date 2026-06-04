/**
 * Delete Lead Sent Email
 * Deletes a lead sent email record by ID.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Deletes a lead sent email by ID.
 *
 * @param supabase - Managed Supabase client
 * @param id - lead_sent_emails row ID
 */
export const deleteLeadSentEmail = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase.from('lead_sent_emails').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lead sent email: ${error.message}`);
  }
};
