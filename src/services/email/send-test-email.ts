/**
 * Test send via Gmail API (Google Workspace service account).
 */

import { getGmailClient, buildMimeMessage } from './gmail';

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
 * Sends a test email via service account + domain-wide delegation.
 */
export const sendTestEmail = async (params: SendTestEmailParams): Promise<void> => {
  const {
    to,
    subject = 'Test Email (Lead Studio)',
    message = 'This is a test email from lead-studio-express-server.',
  } = params;

  const fromEmail = process.env.GMAIL_SEND_AS_EMAIL || 'noreply@example.com';
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Lead Studio';

  const htmlMessage = `
    <html>
      <body>
        <h2>Test Email</h2>
        <p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <p><em>Sent via Workspace service account.</em></p>
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
