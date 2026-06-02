/**
 * Process Gmail Pub/Sub push notification: decode payload, fetch history, detect replies,
 * and update lead_sent_emails / lead_contacts.
 */

import type { gmail_v1 } from 'googleapis';
import { getSupabaseClient } from '../../../db/supabase-client';
import { getGmailWatchStateByEmail, upsertGmailWatchState } from '../../../data/gmail-watch-state';
import { findLeadSentEmailBySgMessageId } from '../../../data/lead-sent-emails/find-by-sg-message-id';
import { updateLeadContact } from '../../../data/lead-contacts';
import { getGmailClient, decodeGmailNotification, listHistory } from '../gmail';

/**
 * Process a single Gmail push notification (run async after returning 200).
 * Loads lastHistoryId, calls history.list, for each new message in thread checks if
 * thread contains a tracked sent message and marks lead_contact as responded.
 */
export const processGmailPushNotification = async (
  messageData: string
): Promise<void> => {
  const notification = decodeGmailNotification(messageData);
  if (!notification) {
    console.warn('Gmail push: invalid or missing message.data');
    return;
  }

  const sendAsEmail = process.env.GMAIL_SEND_AS_EMAIL;
  if (sendAsEmail && notification.emailAddress !== sendAsEmail) {
    console.log(`Gmail push: ignoring notification for ${notification.emailAddress} (expected ${sendAsEmail})`);
    return;
  }

  const supabase = getSupabaseClient();
  const state = await getGmailWatchStateByEmail(supabase, notification.emailAddress);
  const startHistoryId = state?.last_history_id ?? notification.historyId;

  if (startHistoryId === notification.historyId) {
    await upsertGmailWatchState(supabase, notification.emailAddress, notification.historyId);
    return;
  }

  let gmail: gmail_v1.Gmail;
  try {
    gmail = await getGmailClient();
  } catch (e) {
    console.error('Gmail push: failed to get Gmail client:', e);
    return;
  }

  let historyRecords: gmail_v1.Schema$History[];
  try {
    historyRecords = await listHistory(gmail, startHistoryId);
  } catch (e) {
    console.error('Gmail push: history.list failed:', e);
    return;
  }

  const processedThreadIds = new Set<string>();

  for (const record of historyRecords) {
    const added = record.messagesAdded ?? [];
    for (const item of added) {
      const msg = item.message;
      if (!msg?.id || !msg.threadId) continue;

      const threadId = msg.threadId;
      if (processedThreadIds.has(threadId)) continue;

      try {
        const thread = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'minimal' });
        const messageIds = (thread.data.messages ?? []).map((m) => m.id).filter(Boolean) as string[];

        for (const mid of messageIds) {
          const leadSent = await findLeadSentEmailBySgMessageId(supabase, mid);
          if (leadSent) {
            processedThreadIds.add(threadId);
            await updateLeadContact(supabase, leadSent.lead_contact_id, { status: 'responded' });
            console.log(`Gmail push: marked lead_contact ${leadSent.lead_contact_id} as responded (reply in thread ${threadId})`);
            break;
          }
        }
      } catch (e) {
        console.error('Gmail push: thread get failed for', threadId, e);
      }
    }
  }

  await upsertGmailWatchState(supabase, notification.emailAddress, notification.historyId);
}
