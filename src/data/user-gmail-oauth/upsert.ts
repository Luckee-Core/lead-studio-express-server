import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpsertUserGmailOauthInput } from './types';

/**
 * Insert or update encrypted OAuth tokens for a user.
 */
export const upsertUserGmailOauth = async (
  supabase: SupabaseClient,
  input: UpsertUserGmailOauthInput
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('user_gmail_oauth').upsert(
    {
      user_id: input.userId,
      gmail_email: input.gmailEmail,
      refresh_token_ciphertext: input.refreshTokenCiphertext,
      access_token_ciphertext: input.accessTokenCiphertext,
      token_expires_at: input.tokenExpiresAt,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('❌ upsertUserGmailOauth:', error.message);
    throw new Error(error.message);
  }
};
