/**
 * Get Next Queue Item
 * Retrieves the next queued item ordered by scheduled_at (earliest first)
 * Unlike get-due, this does not filter by date/time - it gets the next item regardless of when it's scheduled
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailQueue } from './types';

export const getNextQueueItem = async (
  supabase: SupabaseClient
): Promise<LeadContactEmailQueue | null> => {
  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .select('*')
    .eq('status', 'queued')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch next queue item: ${error.message}`);
  }

  return data || null;
};
