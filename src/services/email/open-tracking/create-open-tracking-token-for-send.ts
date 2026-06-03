import { getOpenTrackingBaseUrl } from './get-open-tracking-base-url';
import { generateOpenTrackingToken } from './generate-open-tracking-token';

/**
 * Returns a token to store on lead_sent_emails when open tracking is enabled; otherwise null.
 */
export const createOpenTrackingTokenForSend = (): string | null => {
  if (!getOpenTrackingBaseUrl()) {
    return null;
  }
  return generateOpenTrackingToken();
};
