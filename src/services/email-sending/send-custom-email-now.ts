/**
 * Send a custom lead contact email immediately (not queued).
 * Fetches email content, attachments, sends via SendGrid, creates lead_sent_email record.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactEmailById } from '../../data/lead-contact-emails';
import { getLeadContactById, updateLeadContact } from '../../data/lead-contacts';
import { createLeadSentEmail } from '../../data/lead-sent-emails';
import { getAttachmentsByEmailId } from '../../data/lead-contact-email-attachments';
import { generateCustomEmail } from '../email-generation';
import { sendLeadEmail } from '../email/send-lead-email';
import { createOpenTrackingTokenForSend } from '../email/open-tracking';
import { downloadEmailAttachment } from '../storage';
import { getMimeType } from '../lead-contact-email-queue/custom-email/get-mime-type';
import { resolveSendAsForLeadContactSend } from '../../utils/email/resolve-send-as-for-lead-contact-send';

export type SendCustomEmailNowInput = {
  leadContactEmailId: string;
  persona_id?: string | null;
  /** When set, overrides draft email_sending_identity_id for this send only. */
  email_sending_identity_id?: string | null;
};

export type SendCustomEmailNowResult = {
  success: true;
  sentEmailId: string;
};

export type SendCustomEmailNowError = {
  success: false;
  error: string;
};

export const sendCustomEmailNow = async (
  supabase: SupabaseClient,
  input: SendCustomEmailNowInput
): Promise<SendCustomEmailNowResult | SendCustomEmailNowError> => {
  const { leadContactEmailId, persona_id: personaId, email_sending_identity_id: identityOverride } =
    input;

  const email = await getLeadContactEmailById(supabase, leadContactEmailId);

  if (!email) {
    return { success: false, error: 'Lead contact email not found' };
  }

  const contact = await getLeadContactById(supabase, email.lead_contact_id);
  if (!contact) {
    return { success: false, error: 'Lead contact not found' };
  }
  if (!contact.email || contact.email.trim() === '') {
    return { success: false, error: 'Lead contact does not have an email address' };
  }

  const emailResult = await generateCustomEmail(supabase, leadContactEmailId);

  const resolvedSendAs = await resolveSendAsForLeadContactSend(
    supabase,
    identityOverride !== undefined ? identityOverride : email.email_sending_identity_id
  );

  const attachments = await getAttachmentsByEmailId(supabase, leadContactEmailId);

  const sgAttachments = await Promise.all(
    attachments.map(async (att) => {
      console.log(`📥 Downloading attachment: ${att.file_name} (${att.file_type}) from ${att.storage_path}`);
      const { data } = await downloadEmailAttachment(supabase, att.storage_path);
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(await data.arrayBuffer());
      if (!buffer.length) {
        throw new Error(`Attachment "${att.file_name}" is empty (download or storage issue)`);
      }
      console.log(`✅ Downloaded ${att.file_name}: ${buffer.length} bytes, converting to base64...`);
      const base64Content = buffer.toString('base64');
      console.log(`✅ Base64 length: ${base64Content.length} chars`);
      return {
        content: base64Content,
        filename: att.file_name,
        type: getMimeType(att.file_type),
      };
    })
  );

  const openTrackingToken = createOpenTrackingTokenForSend();
  if (openTrackingToken) {
    console.log(`📬 Open tracking enabled for send (token ${openTrackingToken.slice(0, 8)}…)`);
  } else {
    console.log('📬 Open tracking disabled (EMAIL_OPEN_TRACKING_BASE_URL not set on this process)');
  }

  const sgMessageId = await sendLeadEmail({
    to: contact.email,
    subject: emailResult.subject,
    body: emailResult.body,
    fromName: emailResult.fromName,
    fromEmail: resolvedSendAs.sendAsEmail,
    gmailUserEmail: resolvedSendAs.sendAsEmail,
    attachments: sgAttachments.length > 0 ? sgAttachments : undefined,
    openTrackingToken,
  });

  console.log(`💾 Creating lead_sent_email record with sg_message_id: ${sgMessageId}`);

  const sentEmail = await createLeadSentEmail(supabase, {
    lead_email_id: leadContactEmailId,
    lead_contact_id: contact.id,
    persona_id: personaId ?? null,
    campaign_id: null,
    campaign_email_variation_id: null,
    status: 'sent',
    sent_at: new Date().toISOString(),
    from_name: emailResult.fromName,
    from_email: resolvedSendAs.sendAsEmail,
    email_sending_identity_id: resolvedSendAs.emailSendingIdentityId,
    sg_message_id: sgMessageId,
    open_tracking_token: openTrackingToken,
  });

  console.log(`✅ Created lead_sent_email record: ${sentEmail.id}, sg_message_id in DB: ${sentEmail.sg_message_id}`);

  if (contact.status === 'not_contacted') {
    await updateLeadContact(supabase, contact.id, { status: 'contacted' });
  }

  return { success: true, sentEmailId: sentEmail.id };
};
