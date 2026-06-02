import type { Page } from 'playwright';
import {
  isDisallowedExternalHost,
  isSameDomainOrSubdomain,
  normalizeHostForSameDomain,
  normalizeHttpUrlString,
} from '../../utils/website/same-domain-link-filters';

/** Cap raw hrefs collected from the DOM before Node-side filtering. */
const MAX_RAW_DOM_HREFS = 120;

const PRIORITY_POSITIVE_SUBSTRINGS = [
  'contact',
  'about',
  'team',
  'services',
  'service',
  'locations',
  'location',
  'our-story',
  'who-we-are',
  'company',
  'careers',
] as const;

const PRIORITY_NEGATIVE_SUBSTRINGS = [
  'login',
  'signin',
  'sign-in',
  'signup',
  'sign-up',
  'register',
  'cart',
  'checkout',
  'privacy',
  'terms',
  'cookie',
] as const;

/**
 * Collect resolved http(s) hrefs from nav, header, and footer regions in the loaded document.
 */
export const collectRawNavFooterHrefsFromOpenPage = async (page: Page): Promise<string[]> => {
  return page.evaluate((max: number) => {
    const selectors = [
      'nav a[href]',
      '[role="navigation"] a[href]',
      'header a[href]',
      '[role="banner"] a[href]',
      'footer a[href]',
      '[role="contentinfo"] a[href]',
      '.site-footer a[href]',
      '#footer a[href]',
      '.footer a[href]',
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    const base = document.baseURI || window.location.href;
    outer: for (const sel of selectors) {
      for (const el of Array.from(document.querySelectorAll(sel))) {
        if (out.length >= max) break outer;
        const href = (el.getAttribute('href') || '').trim();
        if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) continue;
        let abs: string;
        try {
          const u = new URL(href, base);
          if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
          abs = u.href.split('#')[0] ?? u.href;
        } catch {
          continue;
        }
        if (seen.has(abs)) continue;
        seen.add(abs);
        out.push(abs);
      }
    }
    return out;
  }, MAX_RAW_DOM_HREFS);
};

const scoreUrlForCrawlPriority = (fullUrl: string): number => {
  let score = 0;
  const p = fullUrl.toLowerCase();
  for (const kw of PRIORITY_POSITIVE_SUBSTRINGS) {
    if (p.includes(kw)) score += 10;
  }
  for (const kw of PRIORITY_NEGATIVE_SUBSTRINGS) {
    if (p.includes(kw)) score -= 8;
  }
  return score;
};

/**
 * Keep same-domain / non-social links, dedupe by normalized URL, sort by crawl value.
 */
export const filterSortDedupeInternalNavLinks = (
  rawHrefs: string[],
  basePageUrl: URL
): string[] => {
  const baseHost = normalizeHostForSameDomain(basePageUrl.hostname);
  if (!baseHost) return [];

  const scored: { normalized: string; score: number }[] = [];
  const seenNorm = new Set<string>();

  for (const href of rawHrefs) {
    let u: URL;
    try {
      u = new URL(href);
    } catch {
      continue;
    }
    if (!['http:', 'https:'].includes(u.protocol)) continue;
    const host = normalizeHostForSameDomain(u.hostname);
    if (!isSameDomainOrSubdomain(host, baseHost)) continue;
    if (isDisallowedExternalHost(host)) continue;

    const normalized = normalizeHttpUrlString(u);
    if (seenNorm.has(normalized)) continue;
    seenNorm.add(normalized);

    const baseNorm = normalizeHttpUrlString(basePageUrl);
    if (normalized === baseNorm) continue;

    scored.push({
      normalized,
      score: scoreUrlForCrawlPriority(normalized),
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.normalized.localeCompare(b.normalized);
  });

  return scored.map((s) => s.normalized);
};
