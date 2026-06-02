/**
 * Facebook Posts scraper (page URL → posts via n8n).
 */

export type FacebookPostsScraperRunParams = {
  profileUrl: string;
};

export type FacebookPostsScraperRunResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
  /** Set when scrape succeeded; helps persist payload provenance. */
  scraperSource?: 'apify' | 'webhook';
};
