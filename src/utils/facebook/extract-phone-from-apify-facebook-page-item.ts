/**
 * Parses a business phone from one Apify Facebook Pages Scraper dataset item.
 * Primary field: `phone` (string). Fallbacks for actor shape changes.
 */

const asTrimmedPhone = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  return t;
};

/**
 * @param item - First dataset page object or null (already unwrapped from the Apify array).
 */
export const extractPhoneFromApifyFacebookPageItem = (item: unknown): string | null => {
  if (item === null || item === undefined) return null;
  if (typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;

  return (
    asTrimmedPhone(o.phone) ??
    asTrimmedPhone(o.phoneNumber) ??
    asTrimmedPhone(o.businessPhone) ??
    asTrimmedPhone(o.contactPhone) ??
    null
  );
};
