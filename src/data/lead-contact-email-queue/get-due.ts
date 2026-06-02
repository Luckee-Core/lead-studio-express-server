/**
 * Get Due Queue Items
 * Retrieves queue items that are due to be sent (status = 'queued' and scheduled_at <= NOW())
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailQueue } from './types';

export const getDueQueueItems = async (
  supabase: SupabaseClient,
  limit: number = 10
): Promise<LeadContactEmailQueue[]> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch due queue items: ${error.message}`);
  }

  return data || [];
};
