import type { FacebookPostsScraperRunParams, FacebookPostsScraperRunResponse } from './types';
import { isFacebookPostsApifyEnabled } from './config';
import { runApifyFacebookPostsScraper } from './run-apify-facebook-posts-scraper';
import { runWebhookFacebookPostsScraper } from './run-webhook-facebook-posts-scraper';

/**
 * Facebook posts for a public page URL: Apify when `APIFY_API_TOKEN` is set, else n8n webhook.
 */
export const runFacebookPostsScraper = async (
  params: FacebookPostsScraperRunParams
): Promise<FacebookPostsScraperRunResponse> => {
  if (isFacebookPostsApifyEnabled()) {
    return runApifyFacebookPostsScraper(params);
  }
  return runWebhookFacebookPostsScraper(params);
};
