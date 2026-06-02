import type { SupabaseClient } from '@supabase/supabase-js';
import { getQrCodesStorageBucket } from './get-qr-codes-storage-bucket';

/**
 * Removes a QR PNG object from Storage when present. Ignores missing objects.
 */
export const deleteQrCodePngFromStorage = async (
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> => {
  const trimmed = storagePath.trim();
  if (!trimmed) {
    return;
  }

  const bucket = getQrCodesStorageBucket();
  const { error } = await supabase.storage.from(bucket).remove([trimmed]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
};
