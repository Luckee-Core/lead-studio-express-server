/**
 * Get All Lead Sent Emails
 * Fetches all lead sent emails, ordered by sent_at descending. Enriches with lead_id from lead_contacts.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactById } from '../lead-contacts';

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
  sg_message_id?: string | null;
  opened_at?: string | null;
  opened_count?: number | null;
  delivery_status?: string | null;
};

export const getAllLeadSentEmails = async (
  supabase: SupabaseClient
): Promise<(LeadSentEmail & { lead_id?: string })[]> => {
  const { data, error } = await supabase
    .from('lead_sent_emails')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead sent emails: ${error.message}`);
  }

  const rows = data || [];

  const enriched = await Promise.all(
    rows.map(async (email) => {
      const contact = await getLeadContactById(supabase, email.lead_contact_id);
      return {
        ...email,
        lead_id: contact?.lead_id,
      };
    })
  );

  return enriched;
};
