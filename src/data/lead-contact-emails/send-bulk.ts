/**
 * Send Bulk Lead Contact Emails
 * Sends emails to multiple lead contacts and creates sent email records
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactsByIds } from '../lead-contacts';
import { createLeadSentEmail } from '../lead-sent-emails';
import { sendLeadEmail } from '../../services/email/send-lead-email';
import { createOpenTrackingTokenForSend } from '../../services/email/open-tracking';
import { updateLead } from '../leads';
import type { TiptapContent } from './tiptap-types';

export type SendBulkLeadContactEmailsInput = {
  leadEmailId: string;
  contactIds: string[];
  fromName: string;
  variationId: number;
  subject: string;
  body: TiptapContent;
};

export type SendBulkLeadContactEmailsResult = {
  sent: number;
  failed: number;
  errors: string[];
};

export const sendBulkLeadContactEmails = async (
  supabase: SupabaseClient,
  input: SendBulkLeadContactEmailsInput
): Promise<SendBulkLeadContactEmailsResult> => {
  const { leadEmailId, contactIds, fromName, variationId, subject, body } = input;

  // Get contacts by IDs (already filters out contacts without emails)
  const contacts = await getLeadContactsByIds(supabase, contactIds);

  const result: SendBulkLeadContactEmailsResult = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Process each contact
  for (const contact of contacts) {
    try {
      // Validate email
      if (!contact.email || contact.email.trim() === '') {
        result.failed++;
        result.errors.push(`Contact ${contact.id} (${contact.name}) has no email address`);
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        result.failed++;
        result.errors.push(`Contact ${contact.id} (${contact.name}) has invalid email: ${contact.email}`);
        continue;
      }

      const openTrackingToken = createOpenTrackingTokenForSend();

      const sgMessageId = await sendLeadEmail({
        to: contact.email,
        subject,
        body,
        fromName,
        openTrackingToken,
      });

      await createLeadSentEmail(supabase, {
        lead_email_id: leadEmailId,
        lead_contact_id: contact.id,
        status: 'sent',
        from_name: fromName,
        variation_id: variationId,
        sg_message_id: sgMessageId,
        open_tracking_token: openTrackingToken,
      });

      // Update lead status to 'contacted' if currently 'not_contacted'
      if (contact.lead_id) {
        // Only update if status is 'not_contacted' to avoid overwriting other statuses
        const currentLead = await supabase
          .from('leads')
          .select('status')
          .eq('id', contact.lead_id)
          .single();
        
        if (currentLead.data?.status === 'not_contacted') {
          await updateLead(supabase, contact.lead_id, { status: 'contacted' });
        }
      }

      result.sent++;
    } catch (error) {
      result.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to send email to ${contact.name} (${contact.email}): ${errorMessage}`);
    }
  }

  return result;
};
