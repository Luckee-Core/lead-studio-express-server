/**
 * Load most recently sent lead emails with subject + plain-text body (from TipTap JSON).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  plainBodiesFromSentEmailRows,
  type SentEmailPlainBody,
} from './plain-bodies-from-sent-rows';

export type RecentSentEmailPlain = SentEmailPlainBody;

/**
 * Returns up to `limit` sends, newest first. Skips rows whose lead_contact_emails row is missing
 * or has empty subject and body.
 */
export const getRecentSentLeadEmailsWithPlainBodies = async (
  supabase: SupabaseClient,
  limit: number,
): Promise<SentEmailPlainBody[]> => {
  const { data: sentRows, error: sentErr } = await supabase
    .from('lead_sent_emails')
    .select('lead_email_id, sent_at')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (sentErr) {
    throw new Error(`Failed to fetch lead sent emails: ${sentErr.message}`);
  }
  if (!sentRows?.length) {
    return [];
  }

  const normalized = sentRows.map((r) => ({
    lead_email_id: r.lead_email_id as string,
    sent_at: r.sent_at as string,
  }));

  return plainBodiesFromSentEmailRows(supabase, normalized);
};
