/**
 * Facebook posts scraper: Apify (`APIFY_API_TOKEN`) or n8n (`SCRAPER_FACEBOOK_POSTS_WEBHOOK_URL`).
 */

export type FacebookPostsScraperConfig = {
  webhookUrl: string;
  timeoutMs: number;
};

export const getFacebookPostsScraperWebhookUrl = (): string => {
  const url = process.env.SCRAPER_FACEBOOK_POSTS_WEBHOOK_URL ?? '';
  return url.replace(/\/$/, '');
};

/**
 * When true, `runFacebookPostsScraper` uses Apify Facebook Posts Scraper instead of the webhook.
 */
export const isFacebookPostsApifyEnabled = (): boolean =>
  Boolean(process.env.APIFY_API_TOKEN?.trim());

export const getFacebookPostsScraperConfig = (): FacebookPostsScraperConfig => ({
  webhookUrl: getFacebookPostsScraperWebhookUrl(),
  timeoutMs: Number(process.env.SCRAPER_FACEBOOK_POSTS_TIMEOUT_MS) || 120_000,
});
