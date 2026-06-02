/**
 * Fetch Gmail history since a given historyId.
 * Used after push notification to get mailbox changes (new messages, label changes).
 */

import type { gmail_v1 } from 'googleapis';

export type GmailHistoryNotification = {
  emailAddress: string;
  historyId: string;
};

/**
 * Decode Pub/Sub message.data (base64url) to Gmail notification payload.
 */
export const decodeGmailNotification = (data: string): GmailHistoryNotification | null => {
  try {
    let b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as { emailAddress?: string; historyId?: string };
    if (parsed.emailAddress && parsed.historyId != null) {
      return { emailAddress: parsed.emailAddress, historyId: String(parsed.historyId) };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * List history since startHistoryId (exclusive). Returns history records.
 * Pass previous historyId from last notification; use the historyId from the
 * current notification as the new "last" after processing.
 */
export const listHistory = async (
  gmail: gmail_v1.Gmail,
  startHistoryId: string
): Promise<gmail_v1.Schema$History[]> => {
  const result: gmail_v1.Schema$History[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      pageToken,
      historyTypes: ['messageAdded'],
      maxResults: 100,
    });

    const history = res.data.history;
    if (history && history.length > 0) {
      result.push(...history);
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return result;
};
