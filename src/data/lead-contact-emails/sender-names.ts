/**
 * Sender names for lead emails.
 * Randomly selected when generating; stored in lead_sent_emails for tracking.
 */

export const SENDER_NAMES = [
  'Matt Ruiz',
  'Matt',
] as const;

export type SenderName = (typeof SENDER_NAMES)[number];

export const pickRandomSenderName = (): SenderName => {
  const i = Math.floor(Math.random() * SENDER_NAMES.length);
  return SENDER_NAMES[i];
};
