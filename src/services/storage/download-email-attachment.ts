/**
 * Download email attachment from Supabase Storage
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type DownloadEmailAttachmentResult = {
  data: Blob;
  fileName: string;
};

export const downloadEmailAttachment = async (
  supabase: SupabaseClient,
  storagePath: string
): Promise<DownloadEmailAttachmentResult> => {
  const bucket = 'lead-email-attachments';
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message || 'No data returned'}`);
  }

  const fileName = storagePath.split('/').pop() || 'attachment';
  return { data, fileName };
};
