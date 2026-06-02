/**
 * Facebook page details via Apify Facebook Pages Scraper (sync dataset items).
 */

export type FacebookPageDetailsScraperRunParams = {
  profileUrl: string;
};

export type FacebookPageDetailsScraperRunResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};
