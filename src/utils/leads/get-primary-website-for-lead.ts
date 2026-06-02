import type { Lead } from '../../data/leads/get-all';

/**
 * Primary crawl/search URL: `website`, else first non-empty entry in `website_urls`.
 */
export const getPrimaryWebsiteForLead = (
  lead: Pick<Lead, 'website' | 'website_urls'>
): string | null => {
  const w = lead.website?.trim();
  if (w) return w;
  const urls = lead.website_urls;
  if (!Array.isArray(urls)) return null;
  const first = urls.find((u) => typeof u === 'string' && u.trim());
  return first?.trim() ?? null;
};
