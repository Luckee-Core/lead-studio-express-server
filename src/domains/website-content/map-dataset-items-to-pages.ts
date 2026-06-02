/**
 * Map Apify Website Content Crawler dataset items to pages (shared by live crawl and DB replay).
 */

export type WebsiteContentPage = {
  url: string;
  markdown: string;
  title: string;
};

const mapItemToPage = (raw: unknown): WebsiteContentPage | null => {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const url = typeof row.url === 'string' ? row.url.trim() : '';
  if (!url || !url.startsWith('http')) return null;
  const markdown =
    typeof row.markdown === 'string'
      ? row.markdown
      : typeof row.text === 'string'
        ? row.text
        : '';
  const title =
    typeof row.title === 'string'
      ? row.title.trim()
      : typeof row.pageTitle === 'string'
        ? row.pageTitle.trim()
        : '';
  if (!markdown.trim()) return null;
  return { url, markdown, title: title || url };
};

/**
 * Deduplicate by URL; order preserved from first occurrence.
 */
export const mapDatasetItemsToPages = (items: unknown[]): WebsiteContentPage[] => {
  const out: WebsiteContentPage[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const page = mapItemToPage(raw);
    if (!page || seen.has(page.url)) continue;
    seen.add(page.url);
    out.push(page);
  }
  return out;
};

const mapPlaywrightStoredRowsToPages = (items: unknown[]): WebsiteContentPage[] => {
  const out: WebsiteContentPage[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    const text = typeof row.text === 'string' ? row.text : '';
    const title = typeof row.title === 'string' ? row.title.trim() : '';
    if (!url.startsWith('http') || !text.trim()) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, markdown: text.trim(), title: title || url });
  }
  return out;
};

/**
 * Read pages from `website_scrape_runs.scraped_data`: Playwright (current) or legacy Apify dataset.
 */
export const getPagesFromScrapedData = (scraped_data: unknown): WebsiteContentPage[] => {
  if (!scraped_data || typeof scraped_data !== 'object') return [];
  const d = scraped_data as Record<string, unknown>;
  if (d.source === 'playwright' && Array.isArray(d.playwrightPages)) {
    return mapPlaywrightStoredRowsToPages(d.playwrightPages);
  }
  const raw = d.rawDatasetItems;
  return mapDatasetItemsToPages(Array.isArray(raw) ? raw : []);
};
