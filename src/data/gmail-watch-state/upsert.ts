/**
 * Upsert Gmail watch state (last history id) for a user email.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const upsertGmailWatchState = async (
  supabase: SupabaseClient,
  userEmail: string,
  lastHistoryId: string
): Promise<void> => {
  const { error } = await supabase.from('gmail_watch_state').upsert(
    {
      user_email: userEmail,
      last_history_id: lastHistoryId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email' }
  );

  if (error) {
    throw new Error(`Failed to upsert gmail_watch_state: ${error.message}`);
  }
};
