/**
 * Find Lead Sent Email By SendGrid Message ID
 * Supports exact match and partial match (webhook sends long form, we store short form).
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LeadSentEmailRecord = {
  id: string;
  lead_contact_id: string;
  sg_message_id: string | null;
  opened_at: string | null;
  opened_count: number | null;
  delivery_status: string;
};

/**
 * Find a lead_sent_emails row by sg_message_id.
 * Tries exact match first, then partial match (webhook ID starts with stored ID or vice versa).
 */
export const findLeadSentEmailBySgMessageId = async (
  supabase: SupabaseClient,
  sgMessageId: string
): Promise<LeadSentEmailRecord | null> => {
  const { data: exact, error: exactError } = await supabase
    .from('lead_sent_emails')
    .select('id, lead_contact_id, sg_message_id, opened_at, opened_count, delivery_status')
    .eq('sg_message_id', sgMessageId)
    .maybeSingle();

  if (!exactError && exact) {
    return exact as LeadSentEmailRecord;
  }

  const { data: all } = await supabase
    .from('lead_sent_emails')
    .select('id, lead_contact_id, sg_message_id, opened_at, opened_count, delivery_status')
    .not('sg_message_id', 'is', null);

  if (!all || all.length === 0) {
    return null;
  }

  const matched = all.find((row) => {
    const stored = row.sg_message_id as string | null;
    if (!stored) return false;
    return sgMessageId.includes(stored) || stored.includes(sgMessageId);
  });

  return (matched as LeadSentEmailRecord) ?? null;
};
