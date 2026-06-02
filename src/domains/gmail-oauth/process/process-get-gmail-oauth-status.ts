import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserGmailOauthByUserId } from '../../../data/user-gmail-oauth';

export type GmailOauthStatus = {
  connected: boolean;
  gmailEmail: string | null;
};

/**
 * Public status for settings UI (no secrets).
 */
export const processGetGmailOauthStatus = async (
  supabase: SupabaseClient,
  userId: string
): Promise<GmailOauthStatus> => {
  const row = await getUserGmailOauthByUserId(supabase, userId);
  if (!row) {
    return { connected: false, gmailEmail: null };
  }
  return { connected: true, gmailEmail: row.gmail_email };
};
