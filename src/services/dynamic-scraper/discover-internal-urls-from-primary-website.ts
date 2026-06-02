/**
 * One-shot Playwright load of the primary URL; harvest same-domain nav/footer links (no full multi-page crawl).
 */

import { chromium } from 'playwright';
import {
  collectRawNavFooterHrefsFromOpenPage,
  filterSortDedupeInternalNavLinks,
} from './collect-internal-nav-footer-links';
import { NAVIGATION_TIMEOUT_MS } from './constants';
import { parseToHttpUrl } from '../../utils/website/same-domain-link-filters';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (compatible; LuckeeBot/1.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

/** Match legacy fetch-based same-domain discovery cap. */
const MAX_DISCOVERED_URLS = 4;

/**
 * Returns up to four internal page URLs (excluding the loaded homepage), or [] on failure.
 */
export const discoverInternalUrlsFromPrimaryWebsite = async (
  primaryWebsite: string
): Promise<string[]> => {
  const parsed = parseToHttpUrl(primaryWebsite);
  if (!parsed) return [];
  const primaryUrl = parsed.toString();

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_USER_AGENT,
    });
    try {
      const page = await context.newPage();
      try {
        const res = await page.goto(primaryUrl, {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT_MS,
        });
        if (res && res.status() >= 400) {
          console.warn('⚠️ discoverInternalUrlsFromPrimaryWebsite: HTTP', res.status(), {
            primaryUrl,
          });
          return [];
        }

        let basePageUrl: URL;
        try {
          basePageUrl = new URL(page.url() || primaryUrl);
        } catch {
          return [];
        }

        const raw = await collectRawNavFooterHrefsFromOpenPage(page);
        const filtered = filterSortDedupeInternalNavLinks(raw, basePageUrl);
        console.log('🔍 discoverInternalUrlsFromPrimaryWebsite', {
          primaryUrl,
          rawDomHrefCount: raw.length,
          filteredCount: filtered.length,
        });
        return filtered.slice(0, MAX_DISCOVERED_URLS);
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('⚠️ discoverInternalUrlsFromPrimaryWebsite failed', { primaryUrl, error: msg });
    return [];
  } finally {
    await browser.close();
  }
};
