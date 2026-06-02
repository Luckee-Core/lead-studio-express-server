import { getFacebookPostsScraperConfig } from './config';
import type { FacebookPostsScraperRunParams, FacebookPostsScraperRunResponse } from './types';

/**
 * Calls the Facebook Posts n8n webhook with the given page URL.
 */
export const runWebhookFacebookPostsScraper = async (
  params: FacebookPostsScraperRunParams
): Promise<FacebookPostsScraperRunResponse> => {
  const { webhookUrl, timeoutMs } = getFacebookPostsScraperConfig();

  if (!webhookUrl) {
    console.error('❌ [scrapers/facebook-posts] SCRAPER_FACEBOOK_POSTS_WEBHOOK_URL is not set');
    return { success: false, error: 'Facebook Posts scraper webhook URL not configured' };
  }

  console.log('📥 [scrapers/facebook-posts] Calling n8n webhook', { profileUrl: params.profileUrl });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileUrl: params.profileUrl.trim() }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    if (!res.ok) {
      console.error('❌ [scrapers/facebook-posts] Webhook error', res.status, text.slice(0, 200));
      return { success: false, error: `Webhook error ${res.status}: ${text.slice(0, 200)}` };
    }

    if (!text?.trim()) {
      return { success: true, data: null, scraperSource: 'webhook' };
    }

    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      return { success: false, error: 'Webhook returned non-JSON body' };
    }
    console.log('📤 [scrapers/facebook-posts] Webhook response received');
    return { success: true, data, scraperSource: 'webhook' };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ [scrapers/facebook-posts] Webhook failed', err);
    return { success: false, error: message };
  }
};
