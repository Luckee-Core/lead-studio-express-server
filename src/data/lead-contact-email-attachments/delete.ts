/**
 * Delete Attachment
 * Deletes an attachment record from the database
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteAttachment = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('lead_contact_email_attachments')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete attachment: ${error.message}`);
  }
};
