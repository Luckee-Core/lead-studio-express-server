/**
 * Website text via headless Playwright (local); no Apify.
 */

import { scrapeWebsiteUrlsWithPrimaryLinkDiscovery } from '../../services/dynamic-scraper';
import type { PlaywrightScrapedPage } from '../../services/dynamic-scraper';
import type { WebsiteContentPage } from './map-dataset-items-to-pages';

export type { WebsiteContentPage };

const LOG_PREFIX = '[website-content:crawl]';
const PHONE_REGEX = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const MAX_CONTACT_LOG_ITEMS = 10;

export type WebsiteCrawlContactSignals = {
  emails: string[];
  phones: string[];
};

export type ProcessWebsiteContentCrawlResult = {
  pages: WebsiteContentPage[];
  /** Full scrape rows for persistence (includes per-URL errors). */
  playwrightPages: PlaywrightScrapedPage[];
  /** Emails and phones regex-matched from crawled page text (header/footer/body). */
  contactSignals: WebsiteCrawlContactSignals;
};

/**
 * Normalize lead website to an absolute http(s) URL.
 */
export const normalizeWebsiteStartUrl = (raw: string): string => {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

const rowsToAiPages = (rows: PlaywrightScrapedPage[]): WebsiteContentPage[] => {
  const out: WebsiteContentPage[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const text = row.text.trim();
    if (!text || row.error) continue;
    const url = row.url.trim();
    if (!url.startsWith('http')) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      url,
      markdown: text,
      title: row.title.trim() || url,
    });
  }
  return out;
};

const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return raw.trim();
};

const collectContactSignals = (pages: WebsiteContentPage[]): {
  emails: string[];
  phones: string[];
} => {
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();
  for (const page of pages) {
    const text = page.markdown;
    const emails = text.match(EMAIL_REGEX) ?? [];
    for (const email of emails) {
      emailSet.add(normalizeEmail(email));
    }
    const phones = text.match(PHONE_REGEX) ?? [];
    for (const phone of phones) {
      phoneSet.add(normalizePhone(phone));
    }
  }
  return {
    emails: Array.from(emailSet),
    phones: Array.from(phoneSet),
  };
};

/**
 * Scrape primary website plus optional extra URLs; discover same-domain nav/footer links on first load, merge and cap, then scrape.
 */
export const processWebsiteContentCrawl = async (input: {
  website: string;
  additionalUrls?: string[];
}): Promise<ProcessWebsiteContentCrawlResult> => {
  const primary = normalizeWebsiteStartUrl(input.website);
  if (!primary || !/^https?:\/\//i.test(primary)) {
    throw new Error('Invalid website URL for crawl');
  }

  const startedAt = Date.now();
  console.log(`${LOG_PREFIX} playwright primary=${primary} additionalSeedCount=${input.additionalUrls?.length ?? 0}`);

  const { rows: playwrightPages, linkDiscovery } = await scrapeWebsiteUrlsWithPrimaryLinkDiscovery(
    primary,
    input.additionalUrls
  );

  console.log(`${LOG_PREFIX} linkDiscovery`, {
    rawDomHrefCount: linkDiscovery.rawDomHrefCount,
    filteredInternalCount: linkDiscovery.filteredInternalCount,
    mergedSeedCount: linkDiscovery.mergedSeedCount,
    scrapeRowCount: playwrightPages.length,
  });

  const pages = rowsToAiPages(playwrightPages);

  console.log(
    `${LOG_PREFIX} playwright okPages=${pages.length} rows=${playwrightPages.length} elapsedMs=${Date.now() - startedAt}`
  );
  const contactSignals = collectContactSignals(pages);
  console.log(`${LOG_PREFIX} contactSignals`, {
    emailCount: contactSignals.emails.length,
    phoneCount: contactSignals.phones.length,
    emailsSample: contactSignals.emails.slice(0, MAX_CONTACT_LOG_ITEMS),
    phonesSample: contactSignals.phones.slice(0, MAX_CONTACT_LOG_ITEMS),
  });

  return { pages, playwrightPages, contactSignals };
};
