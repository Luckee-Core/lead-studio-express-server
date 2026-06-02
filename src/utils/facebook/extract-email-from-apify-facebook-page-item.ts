/**
 * Parses a business email from one Apify Facebook Pages Scraper dataset item (`result.data` from runFacebookPageDetailsScraper).
 * Primary field: `email` (string). Fallbacks for actor shape changes.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t || !EMAIL_PATTERN.test(t)) return null;
  return t;
};

/**
 * @param item - First dataset page object or null (already unwrapped from the Apify array).
 */
export const extractEmailFromApifyFacebookPageItem = (item: unknown): string | null => {
  if (item === null || item === undefined) return null;
  if (typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;

  const direct =
    normalizeEmail(o.email) ??
    normalizeEmail(o.businessEmail) ??
    normalizeEmail(o.contactEmail);
  if (direct) return direct;

  const emails = o.emails;
  if (Array.isArray(emails)) {
    for (const x of emails) {
      const n = normalizeEmail(x);
      if (n) return n;
    }
  }

  return null;
};
