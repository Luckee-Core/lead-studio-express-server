/**
 * List sent emails for one lead contact with subject + plain-text body (from TipTap JSON).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  plainBodiesFromSentEmailRows,
  type SentEmailPlainBody,
} from './plain-bodies-from-sent-rows';

export type { SentEmailPlainBody };

/**
 * Returns up to `limit` sends for the contact, newest first. Empty if none or all rows lack usable copy.
 *
 * @param supabase - Supabase client (RLS should scope to the caller's workspace).
 * @param leadContactId - Lead contact id.
 * @param limit - Max rows to fetch from `lead_sent_emails`.
 */
export const listSentEmailsWithPlainBodiesForLeadContact = async (
  supabase: SupabaseClient,
  leadContactId: string,
  limit: number,
): Promise<SentEmailPlainBody[]> => {
  const { data: sentRows, error: sentErr } = await supabase
    .from('lead_sent_emails')
    .select('lead_email_id, sent_at')
    .eq('lead_contact_id', leadContactId)
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
