/**
 * Get authenticated Gmail API client using a service account with domain-wide delegation.
 * Requires Google Workspace: admin must grant the service account access to impersonate
 * the user specified by GMAIL_SEND_AS_EMAIL.
 *
 * Credentials: GMAIL_SERVICE_ACCOUNT_JSON_BASE64 (recommended) or GMAIL_SERVICE_ACCOUNT_JSON only.
 */

import { google, type gmail_v1 } from 'googleapis';
import type { JWTInput } from 'google-auth-library';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

function parseJsonCredentials(raw: string, label: string): JWTInput {
  try {
    return JSON.parse(raw) as JWTInput;
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function getServiceAccountCredentials(): JWTInput {
  const b64 = process.env.GMAIL_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  const raw = process.env.GMAIL_SERVICE_ACCOUNT_JSON?.trim();

  if (b64) {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    return parseJsonCredentials(decoded, 'GMAIL_SERVICE_ACCOUNT_JSON_BASE64');
  }
  if (raw) {
    return parseJsonCredentials(raw, 'GMAIL_SERVICE_ACCOUNT_JSON');
  }
  throw new Error(
    'Set GMAIL_SERVICE_ACCOUNT_JSON_BASE64 (recommended on Railway) or GMAIL_SERVICE_ACCOUNT_JSON'
  );
}

export type GetGmailClientOptions = {
  /** When set, JWT subject for domain-wide delegation (Workspace mailbox). Otherwise GMAIL_SEND_AS_EMAIL. */
  sendAsEmail?: string;
};

/**
 * Returns an authenticated Gmail client. The client sends as the user given by
 * `options.sendAsEmail` or GMAIL_SEND_AS_EMAIL (domain-wide delegation).
 */
export const getGmailClient = async (
  options?: GetGmailClientOptions
): Promise<gmail_v1.Gmail> => {
  const sendAsEmail = options?.sendAsEmail?.trim() || process.env.GMAIL_SEND_AS_EMAIL;
  if (!sendAsEmail) {
    throw new Error(
      'GMAIL_SEND_AS_EMAIL environment variable is required (Google Workspace user to send as), or pass sendAsEmail'
    );
  }

  const credentials = getServiceAccountCredentials();
  const clientEmail = (credentials as { client_email?: string }).client_email;
  const privateKey = (credentials as { private_key?: string }).private_key;
  if (!clientEmail || !privateKey) {
    throw new Error('Service account JSON must include client_email and private_key');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [GMAIL_SEND_SCOPE, GMAIL_READONLY_SCOPE],
    subject: sendAsEmail,
  });

  await auth.authorize();
  const gmail = google.gmail({ version: 'v1', auth });
  return gmail;
};
