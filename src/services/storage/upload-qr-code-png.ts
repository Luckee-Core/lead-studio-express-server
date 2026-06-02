import type { SupabaseClient } from '@supabase/supabase-js';
import { getQrCodesStorageBucket } from './get-qr-codes-storage-bucket';

export type UploadQrCodePngInput = {
  storagePath: string;
  file: Buffer;
};

/**
 * Uploads a PNG buffer to the configured QR codes bucket (upsert).
 */
export const uploadQrCodePngToStorage = async (
  supabase: SupabaseClient,
  input: UploadQrCodePngInput,
): Promise<void> => {
  const bucket = getQrCodesStorageBucket();
  const { error } = await supabase.storage.from(bucket).upload(input.storagePath, input.file, {
    contentType: 'image/png',
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
};
