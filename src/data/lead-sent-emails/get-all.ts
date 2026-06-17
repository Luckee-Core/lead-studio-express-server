import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactById } from '../lead-contacts';
import type { ColdEmailOfferingRow } from '../cold-email-offering/types';
import { listLeadSentEmailColdEmailOfferingsBySentEmailIds } from '../lead-sent-email-cold-email-offering';

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

export type LeadSentEmailWithOffering = LeadSentEmail & {
  lead_id?: string;
  cold_email_offering_id?: string | null;
  cold_email_offering?: Pick<ColdEmailOfferingRow, 'id' | 'title' | 'hook'> | null;
};

/**
 * Fetches all lead sent emails, ordered by sent_at descending.
 * Enriches with lead_id and optional cold email offering when includeOfferings is true.
 */
export const getAllLeadSentEmails = async (
  supabase: SupabaseClient,
  options?: { includeOfferings?: boolean },
): Promise<LeadSentEmailWithOffering[]> => {
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
    }),
  );

  if (!options?.includeOfferings) {
    return enriched;
  }

  const junctionRows = await listLeadSentEmailColdEmailOfferingsBySentEmailIds(
    supabase,
    enriched.map((row) => row.id),
  );
  const offeringIdBySentEmailId = new Map(
    junctionRows.map((row) => [row.lead_sent_email_id, row.cold_email_offering_id]),
  );
  const offeringIds = [...new Set(junctionRows.map((row) => row.cold_email_offering_id))];

  const offeringsById = new Map<string, Pick<ColdEmailOfferingRow, 'id' | 'title' | 'hook'>>();
  if (offeringIds.length > 0) {
    const { data: offeringRows, error: offeringError } = await supabase
      .from('cold_email_offering')
      .select('id, title, hook')
      .in('id', offeringIds);

    if (offeringError) {
      throw new Error(`Failed to fetch cold email offerings: ${offeringError.message}`);
    }

    for (const row of offeringRows ?? []) {
      offeringsById.set(row.id, {
        id: row.id,
        title: row.title,
        hook: row.hook,
      });
    }
  }

  return enriched.map((email) => {
    const offeringId = offeringIdBySentEmailId.get(email.id) ?? null;
    return {
      ...email,
      cold_email_offering_id: offeringId,
      cold_email_offering: offeringId ? offeringsById.get(offeringId) ?? null : null,
    };
  });
};
