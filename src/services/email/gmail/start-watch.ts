/**
 * Start or renew Gmail push watch for the delegated user.
 * Watch expires after 7 days; call at least once per week (e.g. daily cron).
 */

import type { gmail_v1 } from 'googleapis';

const DEFAULT_TOPIC = 'projects/tht-web-e2134/topics/gmail-push';

export type WatchResult = {
  historyId: string;
  expiration: string; // ms since epoch
};

/**
 * Call users.watch to start or renew push notifications for the mailbox.
 * Returns historyId and expiration; persist both for incremental sync and renewal timing.
 */
export const startGmailWatch = async (gmail: gmail_v1.Gmail): Promise<WatchResult> => {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC || DEFAULT_TOPIC;

  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName,
      labelIds: ['INBOX'],
      labelFilterBehavior: 'include',
    },
  });

  const historyId = res.data.historyId ?? '';
  const expiration = res.data.expiration ?? '0';
  return { historyId, expiration };
};
