/**
 * Record an email open from the tracking pixel (mirrors SendGrid open webhook logic).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createLeadContactActivity } from '../../data/lead-contact-activities';
import { getLeadContactById } from '../../data/lead-contacts';
import { getLeadById } from '../../data/leads';
import type { LeadSentEmailByOpenTokenRecord } from '../../data/lead-sent-emails/find-by-open-tracking-token';

/** Ignore first pixel hit within this window after send (Gmail/provider prefetch). */
export const FIRST_OPEN_IGNORE_MS = 30_000;

export type RecordLeadSentEmailOpenResult = {
  isFirstOpen: boolean;
  openedCount: number;
  /** True when the hit was ignored as likely prefetch (no DB change). */
  ignoredPrefetch: boolean;
};

const isWithinFirstOpenIgnoreWindow = (sentAt: string, nowMs: number): boolean => {
  const sentMs = new Date(sentAt).getTime();
  if (Number.isNaN(sentMs)) {
    return false;
  }
  return nowMs - sentMs < FIRST_OPEN_IGNORE_MS;
};

/**
 * Updates opened_at / opened_count / delivery_status and logs lead_contact_opened on first open.
 * First open within {@link FIRST_OPEN_IGNORE_MS} of sent_at is ignored (no DB update).
 */
export const recordLeadSentEmailOpen = async (
  supabase: SupabaseClient,
  record: LeadSentEmailByOpenTokenRecord
): Promise<RecordLeadSentEmailOpenResult> => {
  const isFirstOpen = !record.opened_at;
  const nowMs = Date.now();

  if (isFirstOpen && isWithinFirstOpenIgnoreWindow(record.sent_at, nowMs)) {
    const secondsAfterSend = Math.round((nowMs - new Date(record.sent_at).getTime()) / 1000);
    console.log(
      `📬 Open tracking: ignored first hit ${secondsAfterSend}s after send (prefetch window ${FIRST_OPEN_IGNORE_MS / 1000}s), record=${record.id}`
    );
    return {
      isFirstOpen: false,
      openedCount: record.opened_count ?? 0,
      ignoredPrefetch: true,
    };
  }

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

  return { isFirstOpen, openedCount: newCount, ignoredPrefetch: false };
};
