/**
 * Get Gmail watch state by user email (last history id for incremental sync).
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type GmailWatchState = {
  user_email: string;
  last_history_id: string;
  updated_at: string;
};

export const getGmailWatchStateByEmail = async (
  supabase: SupabaseClient,
  userEmail: string
): Promise<GmailWatchState | null> => {
  const { data, error } = await supabase
    .from('gmail_watch_state')
    .select('user_email, last_history_id, updated_at')
    .eq('user_email', userEmail)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as GmailWatchState;
};
