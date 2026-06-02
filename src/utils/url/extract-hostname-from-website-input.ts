/**
 * Normalize CRM website input to a hostname (no scheme, strips leading www.).
 */
export const extractHostnameFromWebsiteInput = (raw: string): string | null => {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto = t.includes('://') ? t : `https://${t}`;
    const host = new URL(withProto).hostname.toLowerCase();
    if (!host) return null;
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
};
