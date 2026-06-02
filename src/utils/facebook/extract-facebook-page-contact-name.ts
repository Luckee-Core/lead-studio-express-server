/**
 * Display name for a lead contact row from Apify page data: page title, then business name, then fallback.
 */

const asTrimmedTitle = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t || null;
};

/**
 * @param item - First dataset page object or null.
 * @param leadBusinessName - From `leads.business_name`.
 */
export const extractFacebookPageContactName = (
  item: unknown,
  leadBusinessName: string
): string => {
  const fromLead = leadBusinessName?.trim();
  if (item === null || item === undefined || typeof item !== 'object') {
    return fromLead || 'Primary contact';
  }
  const o = item as Record<string, unknown>;
  const title =
    asTrimmedTitle(o.title) ??
    asTrimmedTitle(o.pageName) ??
    asTrimmedTitle(o.name) ??
    null;
  return title || fromLead || 'Primary contact';
};
