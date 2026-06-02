/**
 * Check Existing Queue Item
 * Checks if a lead contact already has a queued or sending item in the queue
 * Used to prevent duplicates
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailQueue } from './types';

export const checkExistingQueueItem = async (
  supabase: SupabaseClient,
  lead_contact_id: string
): Promise<LeadContactEmailQueue | null> => {
  // Filter active rows in app code — do not use .in('status', [..., 'sending']) here.
  // Older DBs may define lead_contact_email_queue_status without `sending`; Postgres
  // rejects unknown enum literals in the query even when no rows match.
  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .select('*')
    .eq('lead_contact_id', lead_contact_id);

  if (error) {
    throw new Error(`Failed to check existing queue item: ${error.message}`);
  }

  const rows = data ?? [];
  const active = rows.find(
    (r) => r.status === 'queued' || r.status === 'sending'
  );
  return active ?? null;
};
