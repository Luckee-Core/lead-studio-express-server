/**
 * Process a single custom_email queue item.
 * Sends pre-created email content; no generation.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContactEmailQueue } from '../../../data/lead-contact-email-queue/types';
import { getLeadContactById, updateLeadContact } from '../../../data/lead-contacts';
import { getLeadContactEmailById } from '../../../data/lead-contact-emails';
import { createLeadSentEmail } from '../../../data/lead-sent-emails';
import { getAttachmentsByEmailId } from '../../../data/lead-contact-email-attachments';
import { resolveSendAsForLeadContactSend } from '../../../utils/email/resolve-send-as-for-lead-contact-send';
import { generateCustomEmail } from '../../email-generation';
import { sendLeadEmail } from '../../email/send-lead-email';
import { downloadEmailAttachment } from '../../storage';
import { getMimeType } from './get-mime-type';

export type ProcessCustomEmailResult = {
  success: boolean;
  error?: string;
};

export const processCustomEmailQueueItem = async (
  supabase: SupabaseClient,
  queueItem: LeadContactEmailQueue
): Promise<ProcessCustomEmailResult> => {
  if (queueItem.type !== 'custom_email' || !queueItem.lead_contact_email_id) {
    return { success: false, error: 'Queue item is not custom_email or missing lead_contact_email_id' };
  }

  const contact = await getLeadContactById(supabase, queueItem.lead_contact_id);
  if (!contact) {
    return { success: false, error: 'Lead contact not found' };
  }
  if (!contact.email || contact.email.trim() === '') {
    return { success: false, error: 'Lead contact does not have an email address' };
  }

  if (contact.status === 'bad_email') {
    return {
      success: false,
      error: 'Lead contact is marked bad email; skipped send',
    };
  }

  const draft = await getLeadContactEmailById(supabase, queueItem.lead_contact_email_id);
  if (!draft) {
    return { success: false, error: 'Lead contact email draft not found' };
  }

  const emailResult = await generateCustomEmail(supabase, queueItem.lead_contact_email_id);

  const resolvedSendAs = await resolveSendAsForLeadContactSend(
    supabase,
    draft.email_sending_identity_id
  );

  const attachments = await getAttachmentsByEmailId(supabase, queueItem.lead_contact_email_id);

  const sgAttachments = await Promise.all(
    attachments.map(async (att) => {
      const { data } = await downloadEmailAttachment(supabase, att.storage_path);
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(await data.arrayBuffer());
      if (!buffer.length) {
        throw new Error(`Attachment "${att.file_name}" is empty (download or storage issue)`);
      }
      return {
        content: buffer.toString('base64'),
        filename: att.file_name,
        type: getMimeType(att.file_type),
      };
    })
  );

  const sgMessageId = await sendLeadEmail({
    to: contact.email,
    subject: emailResult.subject,
    body: emailResult.body,
    fromName: emailResult.fromName,
    fromEmail: resolvedSendAs.sendAsEmail,
    gmailUserEmail: resolvedSendAs.sendAsEmail,
    attachments: sgAttachments.length > 0 ? sgAttachments : undefined,
  });

  await createLeadSentEmail(supabase, {
    lead_email_id: emailResult.leadContactEmailId,
    lead_contact_id: queueItem.lead_contact_id,
    persona_id: queueItem.persona_id ?? null,
    campaign_id: queueItem.campaign_id ?? null,
    campaign_email_variation_id: null,
    status: 'sent',
    sent_at: new Date().toISOString(),
    from_name: emailResult.fromName,
    from_email: resolvedSendAs.sendAsEmail,
    email_sending_identity_id: resolvedSendAs.emailSendingIdentityId,
    sg_message_id: sgMessageId,
  });

  if (contact.status === 'not_contacted') {
    await updateLeadContact(supabase, contact.id, { status: 'contacted' });
  }

  return { success: true };
};
