/**
 * Public base URL for email open-tracking pixel requests.
 * When unset, open tracking is disabled (local dev without a tunnel).
 */

/**
 * Returns EMAIL_OPEN_TRACKING_BASE_URL trimmed, without trailing slash, or null if unset.
 */
export const getOpenTrackingBaseUrl = (): string | null => {
  const raw = process.env.EMAIL_OPEN_TRACKING_BASE_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/+$/, '');
};
