/**
 * Supabase Storage bucket for persisted QR PNGs (public reads via `getPublicUrl`).
 */
export const getQrCodesStorageBucket = (): string => {
  const raw = process.env.QR_CODES_STORAGE_BUCKET?.trim();
  return raw && raw.length > 0 ? raw : 'qr-codes';
};
