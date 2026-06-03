/**
 * Get authenticated Gmail API client using a service account with domain-wide delegation.
 * Requires Google Workspace: admin must grant the service account access to impersonate
 * the user specified by GMAIL_SEND_AS_EMAIL.
 *
 * Credentials (first match wins):
 * 1. GMAIL_SERVICE_ACCOUNT_JSON_PATH — path to the downloaded .json key file (local dev)
 * 2. GMAIL_SERVICE_ACCOUNT_JSON — minified JSON string
 * 3. GMAIL_SERVICE_ACCOUNT_JSON_BASE64 — base64-encoded JSON (Railway / hosted)
 */

import fs from 'fs';
import path from 'path';
import { google, type gmail_v1 } from 'googleapis';
import type { JWTInput } from 'google-auth-library';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/**
 * @param raw - JSON string
 * @param label - Env var name for error messages
 */
function parseJsonCredentials(raw: string, label: string): JWTInput {
  try {
    return JSON.parse(raw) as JWTInput;
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

/**
 * Load service account key from env or file.
 */
function getServiceAccountCredentials(): JWTInput {
  const jsonPath = process.env.GMAIL_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (jsonPath) {
    const resolved = path.isAbsolute(jsonPath)
      ? jsonPath
      : path.resolve(process.cwd(), jsonPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`GMAIL_SERVICE_ACCOUNT_JSON_PATH file not found: ${resolved}`);
    }
    const fileContents = fs.readFileSync(resolved, 'utf8');
    return parseJsonCredentials(fileContents, 'GMAIL_SERVICE_ACCOUNT_JSON_PATH');
  }

  const raw = process.env.GMAIL_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    return parseJsonCredentials(raw, 'GMAIL_SERVICE_ACCOUNT_JSON');
  }

  const b64 = process.env.GMAIL_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) {
    // Common mistake: paste raw JSON into the base64 var
    const jsonText = b64.startsWith('{') ? b64 : Buffer.from(b64, 'base64').toString('utf8');
    return parseJsonCredentials(jsonText, 'GMAIL_SERVICE_ACCOUNT_JSON_BASE64');
  }

  throw new Error(
    'Set GMAIL_SERVICE_ACCOUNT_JSON_PATH (path to .json file), GMAIL_SERVICE_ACCOUNT_JSON (one-line JSON), or GMAIL_SERVICE_ACCOUNT_JSON_BASE64'
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
