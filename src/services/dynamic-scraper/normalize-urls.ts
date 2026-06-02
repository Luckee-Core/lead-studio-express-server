import { MAX_URLS_PER_RUN } from './constants';

/**
 * Trim, add https if missing, dedupe, keep only http(s), cap count.
 */
export const normalizeAndCapUrls = (raw: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of raw) {
    const t = r.trim();
    if (!t) continue;
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    let u: URL;
    try {
      u = new URL(withProto);
    } catch {
      continue;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
    const key = u.href.split('#')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u.href);
    if (out.length >= MAX_URLS_PER_RUN) break;
  }
  return out;
};
