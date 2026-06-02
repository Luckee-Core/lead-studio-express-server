import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteUserGmailOauthByUserId } from '../../../data/user-gmail-oauth';

/**
 * Remove stored Gmail credentials for the user.
 */
export const processDisconnectGmailOauth = async (
  supabase: SupabaseClient,
  userId: string
): Promise<void> => {
  await deleteUserGmailOauthByUserId(supabase, userId);
};
