/**
 * Find Lead Sent Email By Open Tracking Token
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LeadSentEmailByOpenTokenRecord = {
  id: string;
  lead_contact_id: string;
  lead_email_id: string;
  sent_at: string;
  opened_at: string | null;
  opened_count: number | null;
  delivery_status: string | null;
};

/**
 * Find a lead_sent_emails row by open_tracking_token (pixel query param `t`).
 */
export const findLeadSentEmailByOpenTrackingToken = async (
  supabase: SupabaseClient,
  token: string
): Promise<LeadSentEmailByOpenTokenRecord | null> => {
  const { data, error } = await supabase
    .from('lead_sent_emails')
    .select('id, lead_contact_id, lead_email_id, sent_at, opened_at, opened_count, delivery_status')
    .eq('open_tracking_token', token)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find lead sent email by open token: ${error.message}`);
  }

  return (data as LeadSentEmailByOpenTokenRecord) ?? null;
};
