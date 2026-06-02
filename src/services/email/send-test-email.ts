/**
 * Test send: service account (Workspace) or per-user Gmail OAuth (Luckee).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getGmailClient, buildMimeMessage, getGmailClientForOAuthUser } from './gmail';

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

type SendTestEmailParams = {
  to: string;
  subject?: string;
  message?: string;
};

/**
 * Sends a test email via service account + domain-wide delegation (legacy).
 */
export const sendTestEmail = async (params: SendTestEmailParams): Promise<void> => {
  const {
    to,
    subject = 'Test Email from MentorAI Server',
    message = 'This is a test email from the MentorAI Server.',
  } = params;

  const fromEmail = process.env.GMAIL_SEND_AS_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@trouthousetech.com';

  const senderNames = ['Chooch', 'Matt Ruiz', 'Philly AI', 'THT'];
  const fromName = process.env.SENDGRID_FROM_NAME || senderNames[Math.floor(Math.random() * senderNames.length)];

  const htmlMessage = `
    <html>
      <body>
        <h2>Test Email</h2>
        <p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <p><em>This is a test email sent from the MentorAI Server.</em></p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </body>
    </html>
  `;

  const from = `${fromName} <${fromEmail}>`;
  const mime = buildMimeMessage({
    from,
    to,
    subject,
    text: message,
    html: htmlMessage,
  });

  const gmail = await getGmailClient();
  const raw = toBase64Url(mime);
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
};

type SendTestEmailAsOAuthUserParams = SendTestEmailParams & {
  supabase: SupabaseClient;
  userId: string;
};

export const GMAIL_NOT_CONNECTED_CODE = 'GMAIL_NOT_CONNECTED';

/**
 * Sends a test email from the user's connected Gmail (OAuth). No service-account fallback.
 */
export const sendTestEmailAsOAuthUser = async (params: SendTestEmailAsOAuthUserParams): Promise<void> => {
  const {
    supabase,
    userId,
    to,
    subject = 'Test email (Luckee)',
    message = 'This is a test email sent from your connected Gmail account.',
  } = params;

  const oauth = await getGmailClientForOAuthUser(supabase, userId);
  if (!oauth) {
    const err = new Error(GMAIL_NOT_CONNECTED_CODE) as Error & { code: string };
    (err as Error & { code: string }).code = GMAIL_NOT_CONNECTED_CODE;
    throw err;
  }

  const fromName = process.env.GMAIL_OAUTH_FROM_DISPLAY_NAME?.trim() || 'Luckee';
  const from = `${fromName} <${oauth.fromEmail}>`;

  const htmlMessage = `
    <html>
      <body>
        <h2>Test Email</h2>
        <p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <p><em>Sent via your connected Gmail.</em></p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </body>
    </html>
  `;

  const mime = buildMimeMessage({
    from,
    to,
    subject,
    text: message,
    html: htmlMessage,
  });

  const raw = toBase64Url(mime);
  await oauth.gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
};
