import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Remove stored Gmail OAuth credentials for a user.
 */
export const deleteUserGmailOauthByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<void> => {
  const { error } = await supabase.from('user_gmail_oauth').delete().eq('user_id', userId);

  if (error) {
    console.error('❌ deleteUserGmailOauthByUserId:', error.message);
    throw new Error(error.message);
  }
};
