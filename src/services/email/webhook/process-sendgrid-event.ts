/**
 * Process SendGrid Webhook Event
 * Processes a single SendGrid webhook event and updates lead_sent_emails records.
 * Handles: delivered, bounce, deferred, open, reply.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { findLeadSentEmailBySgMessageId } from '../../../data/lead-sent-emails/find-by-sg-message-id';
import { updateLeadContact } from '../../../data/lead-contacts';

export type SendGridWebhookEvent = {
  email: string;
  timestamp: number;
  event: string;
  sg_event_id: string;
  sg_message_id: string;
  response?: string;
  attempt?: string;
  useragent?: string;
  ip?: string;
  url?: string;
  reason?: string;
  status?: string;
  type?: string;
  tls?: number;
  cert_err?: number;
  unique_args?: Record<string, unknown>;
  marketing_campaign_id?: string;
  marketing_campaign_name?: string;
  category?: string[];
  asm_group_id?: number;
  ip_pool?: string;
  url_offset?: {
    index: number;
    type: string;
  };
};

type DeliveryStatus = 'sent' | 'delivered' | 'bounced' | 'deferred' | 'opened';

/**
 * Process a single SendGrid webhook event.
 * Updates lead_sent_emails delivery_status and related fields.
 */
export const processSendGridEvent = async (
  supabase: SupabaseClient,
  event: SendGridWebhookEvent
): Promise<void> => {
  const { event: eventType, sg_message_id, timestamp } = event;

  if (!sg_message_id) {
    console.warn(`No sg_message_id for event: ${eventType}, skipping`);
    return;
  }

  const record = await findLeadSentEmailBySgMessageId(supabase, sg_message_id);

  if (!record) {
    console.log(`No lead_sent_emails record for sg_message_id: ${sg_message_id} (${eventType}), skipping`);
    return;
  }

  const current = (record.delivery_status || 'sent') as DeliveryStatus;

  switch (eventType) {
    case 'delivered': {
      if (current !== 'bounced') {
        await supabase
          .from('lead_sent_emails')
          .update({ delivery_status: 'delivered', updated_at: new Date().toISOString() })
          .eq('id', record.id);
        console.log(`Updated delivery_status=delivered for sg_message_id=${sg_message_id}, record=${record.id}`);
      }
      break;
    }
    case 'bounce':
    case 'dropped': {
      await supabase
        .from('lead_sent_emails')
        .update({ delivery_status: 'bounced', updated_at: new Date().toISOString() })
        .eq('id', record.id);
      console.log(`Updated delivery_status=bounced for sg_message_id=${sg_message_id}, record=${record.id}`);

      if (record.lead_contact_id) {
        try {
          await updateLeadContact(supabase, record.lead_contact_id, {
            status: 'bad_email',
          });
          console.log(
            `Updated lead contact ${record.lead_contact_id} status to bad_email after ${eventType}`
          );
        } catch (e) {
          console.error('Failed to update lead contact status after bounce/drop:', e);
        }
      }
      break;
    }
    case 'deferred': {
      if (current === 'sent') {
        await supabase
          .from('lead_sent_emails')
          .update({ delivery_status: 'deferred', updated_at: new Date().toISOString() })
          .eq('id', record.id);
        console.log(`Updated delivery_status=deferred for sg_message_id=${sg_message_id}, record=${record.id}`);
      }
      break;
    }
    case 'open': {
      const isFirstOpen = !record.opened_at;
      const newCount = (record.opened_count ?? 0) + 1;
      const openedAt = isFirstOpen ? new Date((timestamp || 0) * 1000).toISOString() : record.opened_at;
      const updates: Record<string, unknown> = {
        opened_at: openedAt,
        opened_count: newCount,
        updated_at: new Date().toISOString(),
      };
      if (current !== 'bounced') {
        updates.delivery_status = 'opened';
      }

      await supabase.from('lead_sent_emails').update(updates).eq('id', record.id);
      console.log(`Updated open tracking: first_open=${isFirstOpen}, count=${newCount}, record=${record.id}`);
      break;
    }
    case 'reply': {
      try {
        await updateLeadContact(supabase, record.lead_contact_id, { status: 'responded' });
        console.log(`Updated lead contact ${record.lead_contact_id} status to 'responded' after reply`);
      } catch (e) {
        console.error('Failed to update lead contact status:', e);
      }
      break;
    }
    case 'processed':
      break;
    default:
      console.log(`Unhandled SendGrid event: ${eventType} for sg_message_id=${sg_message_id}`);
  }
};
