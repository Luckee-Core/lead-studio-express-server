/**
 * Get Latest Queue Item
 * Retrieves the queue item with the latest scheduled_at time
 * Used to calculate the next scheduled time for new queue items
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailQueue } from './types';

export const getLatestQueueItem = async (
  supabase: SupabaseClient
): Promise<LeadContactEmailQueue | null> => {
  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest queue item: ${error.message}`);
  }

  return data;
};
