/**
 * Record an email open from the tracking pixel (mirrors SendGrid open webhook logic).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createLeadContactActivity } from '../../data/lead-contact-activities';
import { getLeadContactById } from '../../data/lead-contacts';
import { getLeadById } from '../../data/leads';
import type { LeadSentEmailByOpenTokenRecord } from '../../data/lead-sent-emails/find-by-open-tracking-token';

export type RecordLeadSentEmailOpenResult = {
  isFirstOpen: boolean;
  openedCount: number;
};

/**
 * Updates opened_at / opened_count / delivery_status and logs lead_contact_opened on first open.
 */
export const recordLeadSentEmailOpen = async (
  supabase: SupabaseClient,
  record: LeadSentEmailByOpenTokenRecord
): Promise<RecordLeadSentEmailOpenResult> => {
  const isFirstOpen = !record.opened_at;
  const newCount = (record.opened_count ?? 0) + 1;
  const openedAt = isFirstOpen ? new Date().toISOString() : record.opened_at;
  const currentStatus = record.delivery_status ?? '';

  const updates: Record<string, unknown> = {
    opened_at: openedAt,
    opened_count: newCount,
    updated_at: new Date().toISOString(),
  };

  if (currentStatus !== 'bounced') {
    updates.delivery_status = 'opened';
  }

  const { error } = await supabase.from('lead_sent_emails').update(updates).eq('id', record.id);

  if (error) {
    throw new Error(`Failed to record email open: ${error.message}`);
  }

  console.log(
    `✅ Open tracking pixel: first_open=${isFirstOpen}, count=${newCount}, record=${record.id}`
  );

  if (isFirstOpen) {
    try {
      const contact = await getLeadContactById(supabase, record.lead_contact_id);
      if (contact?.lead_id) {
        const lead = await getLeadById(supabase, contact.lead_id);
        const customerName = lead?.business_name || lead?.name || contact.name || 'Lead';
        await createLeadContactActivity(supabase, {
          lead_contact_id: contact.id,
          lead_id: contact.lead_id,
          customer_id: contact.lead_id,
          customer_name: customerName,
          activity_type: 'lead_contact_opened',
        });
      }
    } catch (activityError) {
      console.error('⚠️ Failed to create lead_contact_opened activity:', activityError);
    }
  }

  return { isFirstOpen, openedCount: newCount };
};
