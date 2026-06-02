/**
 * Headless Playwright: visit each URL, extract body text + metadata.
 */

import { chromium } from 'playwright';
import {
  collectRawNavFooterHrefsFromOpenPage,
  filterSortDedupeInternalNavLinks,
} from './collect-internal-nav-footer-links';
import { normalizeAndCapUrls } from './normalize-urls';
import { extractLoadedPlaywrightPageContent, scrapePageWithPlaywright } from './scrape-page';
import { NAVIGATION_TIMEOUT_MS } from './constants';
import type { PlaywrightScrapedPage } from './types';
import { normalizeHttpUrlString } from '../../utils/website/same-domain-link-filters';

export type { PlaywrightScrapedPage } from './types';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (compatible; LuckeeBot/1.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

export type PrimaryLinkDiscoveryMeta = {
  rawDomHrefCount: number;
  filteredInternalCount: number;
  mergedSeedCount: number;
};

export type PrimaryLinkDiscoveryCrawlResult = {
  rows: PlaywrightScrapedPage[];
  linkDiscovery: PrimaryLinkDiscoveryMeta;
};

/**
 * Scrape one or more http(s) URLs in one browser session (no DOM link discovery).
 */
export const scrapeWebsiteUrls = async (urls: string[]): Promise<PlaywrightScrapedPage[]> => {
  const list = normalizeAndCapUrls(urls);
  if (list.length === 0) {
    return [];
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_USER_AGENT,
    });
    try {
      const results: PlaywrightScrapedPage[] = [];
      for (const url of list) {
        const page = await context.newPage();
        try {
          results.push(await scrapePageWithPlaywright(page, url));
        } finally {
          await page.close();
        }
      }
      return results;
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
};

const emptyDiscoveryMeta = (): PrimaryLinkDiscoveryMeta => ({
  rawDomHrefCount: 0,
  filteredInternalCount: 0,
  mergedSeedCount: 0,
});

/**
 * Load primary URL once, harvest same-domain nav/footer links, merge with optional seeds, cap, then scrape remaining URLs.
 */
export const scrapeWebsiteUrlsWithPrimaryLinkDiscovery = async (
  primary: string,
  additionalUrls?: string[]
): Promise<PrimaryLinkDiscoveryCrawlResult> => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_USER_AGENT,
    });
    try {
      const firstPage = await context.newPage();
      try {
        try {
          const gotoResponse = await firstPage.goto(primary, {
            waitUntil: 'domcontentloaded',
            timeout: NAVIGATION_TIMEOUT_MS,
          });

          if (gotoResponse && gotoResponse.status() >= 400) {
            return {
              rows: [
                {
                  url: primary,
                  title: '',
                  text: '',
                  metadata: {},
                  error: `HTTP ${gotoResponse.status()}`,
                },
              ],
              linkDiscovery: emptyDiscoveryMeta(),
            };
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return {
            rows: [
              {
                url: primary,
                title: '',
                text: '',
                metadata: {},
                error: msg,
              },
            ],
            linkDiscovery: emptyDiscoveryMeta(),
          };
        }

        const firstRow = await extractLoadedPlaywrightPageContent(firstPage, primary);
        const results: PlaywrightScrapedPage[] = [firstRow];

        let basePageUrl: URL;
        try {
          basePageUrl = new URL(firstPage.url() || primary);
        } catch {
          return { rows: results, linkDiscovery: emptyDiscoveryMeta() };
        }

        const rawHrefs = await collectRawNavFooterHrefsFromOpenPage(firstPage);
        const discoveredSorted = filterSortDedupeInternalNavLinks(rawHrefs, basePageUrl);
        const merged = normalizeAndCapUrls([
          primary,
          ...discoveredSorted,
          ...(additionalUrls ?? []),
        ]);

        let loadedKey: string;
        try {
          loadedKey = normalizeHttpUrlString(new URL(firstPage.url() || primary));
        } catch {
          loadedKey = '';
        }
        const seenKeys = new Set<string>(loadedKey ? [loadedKey] : []);

        for (const url of merged.slice(1)) {
          let key: string;
          try {
            key = normalizeHttpUrlString(new URL(url));
          } catch {
            continue;
          }
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          const page = await context.newPage();
          try {
            results.push(await scrapePageWithPlaywright(page, url));
          } finally {
            await page.close();
          }
        }

        return {
          rows: results,
          linkDiscovery: {
            rawDomHrefCount: rawHrefs.length,
            filteredInternalCount: discoveredSorted.length,
            mergedSeedCount: merged.length,
          },
        };
      } finally {
        await firstPage.close();
      }
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
};
