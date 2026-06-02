import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserGmailOauthRow } from './types';

/**
 * Load Gmail OAuth row for a Supabase user, or null.
 */
export const getUserGmailOauthByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<UserGmailOauthRow | null> => {
  const { data, error } = await supabase
    .from('user_gmail_oauth')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ getUserGmailOauthByUserId:', error.message);
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return data as UserGmailOauthRow;
};
