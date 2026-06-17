import { SupabaseClient } from '@supabase/supabase-js';
import { getAllLeadSentEmailColdEmailOfferings } from '../lead-sent-email-cold-email-offering';

export type LeadSentEmail = {
  id: string;
  lead_email_id: string;
  lead_contact_id: string;
  persona_id?: string | null;
  campaign_id: string | null;
  campaign_email_variation_id: string | null;
  status: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
  from_name?: string | null;
  from_email?: string | null;
  email_sending_identity_id?: string | null;
  variation_id?: number | null;
  /** Gmail API message id. */
  sg_message_id?: string | null;
  opened_at?: string | null;
  opened_count?: number | null;
  delivery_status?: string | null;
};

export type LeadSentEmailWithOfferingId = LeadSentEmail & {
  cold_email_offering_id?: string | null;
};

/**
 * Fetches all lead sent emails, ordered by sent_at descending.
 * Merges cold_email_offering_id from the full junction table (no per-id lookups).
 */
export const getAllLeadSentEmails = async (
  supabase: SupabaseClient,
): Promise<LeadSentEmailWithOfferingId[]> => {
  const { data, error } = await supabase
    .from('lead_sent_emails')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead sent emails: ${error.message}`);
  }

  const rows = data || [];
  const junctionRows = await getAllLeadSentEmailColdEmailOfferings(supabase);
  const offeringIdBySentEmailId = new Map(
    junctionRows.map((row) => [row.lead_sent_email_id, row.cold_email_offering_id]),
  );

  return rows.map((email) => ({
    ...email,
    cold_email_offering_id: offeringIdBySentEmailId.get(email.id) ?? null,
  }));
};
