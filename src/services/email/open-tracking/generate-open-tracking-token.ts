import { randomBytes } from 'crypto';

/**
 * Generate a URL-safe open-tracking token for lead_sent_emails.open_tracking_token.
 */
export const generateOpenTrackingToken = (): string => {
  return randomBytes(32).toString('base64url');
};
