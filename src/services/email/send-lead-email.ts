/**
 * Send a lead email via Gmail API (Google Workspace).
 * Used when user explicitly sends from the UI; from_name and variation_id
 * are stored in lead_sent_emails by the caller.
 * Requires GMAIL_SERVICE_ACCOUNT_JSON_BASE64 or GMAIL_SERVICE_ACCOUNT_JSON, plus GMAIL_SEND_AS_EMAIL
 * (or gmailUserEmail / per-identity env resolution from the caller).
 */

import type { TiptapContent } from '../../data/lead-contact-emails/tiptap-types';
import { tiptapToPlainText } from '../../data/lead-contact-emails/tiptap-to-plain-text';
import { tiptapToHtml } from '../../data/lead-contact-emails/tiptap-to-html';
import { getGmailClient, buildMimeMessage } from './gmail';

export type SendLeadEmailAttachment = {
  content: string;
  filename: string;
  type: string;
};

/**
 * Sanitize filename for MIME safety. Many mail gateways reject or quarantine
 * messages when attachment filenames contain quotes, backslashes, or newlines.
 */
const sanitizeAttachmentFilename = (name: string): string => {
  const base = name.replace(/^.*[/\\]/, '').trim() || 'attachment';
  const safe = base.replace(/[\r\n"\\\x00-\x1f]/g, '_').replace(/\s+/g, '_');
  return safe.slice(0, 255) || 'attachment';
};

export type SendLeadEmailParams = {
  to: string;
  subject: string;
  body: TiptapContent | Record<string, unknown>;
  fromName: string;
  fromEmail?: string;
  /** Gmail API impersonation (JWT subject); should match the mailbox in the MIME From when using Workspace delegation. */
  gmailUserEmail?: string;
  attachments?: SendLeadEmailAttachment[];
};

/**
 * Encode MIME message as base64url for Gmail API.
 */
const toBase64Url = (raw: string): string => {
  return Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const sendLeadEmail = async (params: SendLeadEmailParams): Promise<string | null> => {
  const {
    to,
    subject,
    body,
    fromName,
    fromEmail = process.env.GMAIL_SEND_AS_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'matt@trouthousetech.com',
    gmailUserEmail,
    attachments = [],
  } = params;

  const plain = tiptapToPlainText(body as TiptapContent);
  const html = tiptapToHtml(body as TiptapContent);

  console.log(`📧 Sending email to: ${to}, subject: "${subject}", attachments: ${attachments.length}`);

  const normalizedAttachments = attachments.map((att) => {
    const content = att.content.replace(/\s/g, '');
    if (!content) {
      throw new Error(`Attachment "${att.filename}" has empty content`);
    }
    const sanitizedFilename = sanitizeAttachmentFilename(att.filename);
    console.log(`📎 Attachment: "${att.filename}" → "${sanitizedFilename}", type: ${att.type}, size: ${content.length} chars (base64)`);
    return {
      content,
      filename: sanitizedFilename,
      type: att.type,
    };
  });

  const from = `${fromName} <${fromEmail}>`;
  const mime = buildMimeMessage({
    from,
    to,
    subject,
    text: plain,
    html,
    attachments: normalizedAttachments,
  });

  const gmail = await getGmailClient(
    gmailUserEmail ? { sendAsEmail: gmailUserEmail } : undefined
  );
  const raw = toBase64Url(mime);
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  const messageId = response.data.id ?? null;
  console.log(`✅ Gmail accepted email, message ID: ${messageId}`);
  return messageId;
};
