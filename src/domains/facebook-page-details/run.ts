import type {
  FacebookPageDetailsScraperRunParams,
  FacebookPageDetailsScraperRunResponse,
} from './types';
import { getFacebookPageDetailsScraperConfig } from './config';

/**
 * @see https://apify.com/apify/facebook-pages-scraper
 * @see https://api.apify.com/v2/acts/apify~facebook-pages-scraper/run-sync-get-dataset-items
 */
const APIFY_FACEBOOK_PAGES_RUN_SYNC_DATASET_ITEMS =
  'https://api.apify.com/v2/acts/apify~facebook-pages-scraper/run-sync-get-dataset-items';

const LOG_PREFIX = '[scrapers/facebook-page-details]';

type ApifyFacebookPagesInput = {
  startUrls: { url: string }[];
};

const normalizePageUrl = (raw: string): string => {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

const buildApifyRequestUrl = (timeoutSeconds: number): string => {
  const token = process.env.APIFY_API_TOKEN?.trim();
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not set (Apify Console → Integrations → API token)');
  }
  const u = new URL(APIFY_FACEBOOK_PAGES_RUN_SYNC_DATASET_ITEMS);
  u.searchParams.set('token', token);
  u.searchParams.set('timeout', String(timeoutSeconds));
  return u.toString();
};

/**
 * Runs Apify Facebook Pages Scraper for one page URL; returns first dataset item (or null).
 */
export const runFacebookPageDetailsScraper = async (
  params: FacebookPageDetailsScraperRunParams
): Promise<FacebookPageDetailsScraperRunResponse> => {
  const { timeoutMs } = getFacebookPageDetailsScraperConfig();
  const pageUrl = normalizePageUrl(params.profileUrl);
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
    return { success: false, error: 'Invalid Facebook page URL' };
  }

  let requestUrl: string;
  try {
    requestUrl = buildApifyRequestUrl(Math.min(300, Math.max(60, Math.ceil(timeoutMs / 1000))));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Apify not configured';
    console.error(`❌ ${LOG_PREFIX}`, message);
    return { success: false, error: message };
  }

  const body: ApifyFacebookPagesInput = {
    startUrls: [{ url: pageUrl }],
  };

  console.log(`📥 ${LOG_PREFIX} Apify start url=${pageUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`❌ ${LOG_PREFIX} Apify timed out after ${timeoutMs}ms`);
      return { success: false, error: `Facebook page scrape timed out after ${timeoutMs}ms` };
    }
    console.error(`❌ ${LOG_PREFIX} Apify fetch failed`, err);
    return { success: false, error: message };
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    console.error(`❌ ${LOG_PREFIX} non-JSON body`, text.slice(0, 300));
    return {
      success: false,
      error: `Apify returned non-JSON (HTTP ${res.status})`,
    };
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? JSON.stringify((parsed as { error: unknown }).error)
        : text.slice(0, 400);
    console.error(`❌ ${LOG_PREFIX} HTTP ${res.status}`, msg);
    return {
      success: false,
      error: `Apify Facebook scrape failed: HTTP ${res.status} ${msg}`,
    };
  }

  if (!Array.isArray(parsed)) {
    console.error(`❌ ${LOG_PREFIX} expected dataset array, got`, typeof parsed);
    return {
      success: false,
      error: 'Apify returned unexpected JSON (expected a dataset items array)',
    };
  }

  const first = parsed.length > 0 ? parsed[0] : null;
  console.log(`📤 ${LOG_PREFIX} Apify items=${parsed.length}`);
  return { success: true, data: first };
};
