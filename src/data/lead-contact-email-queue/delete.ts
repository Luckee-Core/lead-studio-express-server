/**
 * Delete Queue Item
 * Deletes a queue item by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteQueueItem = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('lead_contact_email_queue')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete queue item: ${error.message}`);
  }
};
