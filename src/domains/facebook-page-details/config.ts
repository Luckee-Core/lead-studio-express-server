/**
 * Facebook page details via Apify Facebook Pages Scraper (sync dataset).
 * Token: APIFY_API_TOKEN (shared with website content crawler).
 */

export type FacebookPageDetailsScraperConfig = {
  timeoutMs: number;
};

export const getFacebookPageDetailsScraperConfig = (): FacebookPageDetailsScraperConfig => ({
  timeoutMs: Number(process.env.SCRAPER_FACEBOOK_PAGE_DETAILS_TIMEOUT_MS) || 300_000,
});
