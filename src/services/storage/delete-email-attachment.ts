/**
 * Delete email attachment from Supabase Storage
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteEmailAttachment = async (
  supabase: SupabaseClient,
  storagePath: string
): Promise<void> => {
  const bucket = 'lead-email-attachments';
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
};
