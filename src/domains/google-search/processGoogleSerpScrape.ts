/**
 * Google SERP links via Apify Google Search Results Scraper (sync dataset).
 * @see https://apify.com/apify/google-search-scraper
 * @see https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items
 */

import { extractHostnameFromWebsiteInput } from '../../utils/url/extract-hostname-from-website-input';

export type SerpLink = {
  title: string;
  url: string;
};

const LOG_PREFIX = '[google-search:serp]';

const APIFY_RUN_SYNC_DATASET_ITEMS =
  'https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items';

/** Client HTTP timeout (Apify actor may run up to server max; Railway often allows 60s+ for requests — tune if needed). */
const FETCH_TIMEOUT_MS = 180_000;

/**
 * Builds the Google web search query from business context (generic first-page discovery).
 */
export const buildGoogleWebSearchQuery = (input: {
  businessName: string;
  city: string;
  state: string;
}): string => {
  return [input.businessName.trim(), input.city.trim(), input.state.trim()]
    .filter(Boolean)
    .join(' ');
};

/**
 * Single SERP query biased toward Facebook, Instagram, and Google Maps / reviews for a business that already has a website.
 * @deprecated Prefer per-platform builders for lead Google search.
 */
export const buildSocialProfilesGoogleSearchQuery = (input: {
  businessName: string;
  city: string;
  state: string;
  /** Raw website URL or hostname from CRM */
  websiteUrl: string;
}): string => {
  const host = extractHostnameFromWebsiteInput(input.websiteUrl);
  const geo = [input.city.trim(), input.state.trim()].filter(Boolean).join(' ');
  const parts = [
    input.businessName.trim(),
    geo,
    host,
    'facebook',
    'instagram',
    'google maps reviews',
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  return parts.join(' ');
};

type SocialSerpBase = {
  businessName: string;
  city: string;
  state: string;
  websiteUrl: string;
};

/** Google query focused on Facebook page for this business. */
export const buildFacebookGoogleSearchQuery = (input: SocialSerpBase): string => {
  const host = extractHostnameFromWebsiteInput(input.websiteUrl);
  const geo = [input.city.trim(), input.state.trim()].filter(Boolean).join(' ');
  const parts = [
    input.businessName.trim(),
    geo,
    host,
    'facebook',
    'facebook page',
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  return parts.join(' ');
};

/** Google query focused on Instagram profile for this business. */
export const buildInstagramGoogleSearchQuery = (input: SocialSerpBase): string => {
  const host = extractHostnameFromWebsiteInput(input.websiteUrl);
  const geo = [input.city.trim(), input.state.trim()].filter(Boolean).join(' ');
  const parts = [
    input.businessName.trim(),
    geo,
    host,
    'instagram',
    'instagram profile',
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  return parts.join(' ');
};

/** Google query focused on LinkedIn company page for this business. */
export const buildLinkedInGoogleSearchQuery = (input: SocialSerpBase): string => {
  const host = extractHostnameFromWebsiteInput(input.websiteUrl);
  const geo = [input.city.trim(), input.state.trim()].filter(Boolean).join(' ');
  const parts = [
    input.businessName.trim(),
    geo,
    host,
    'linkedin',
    'linkedin company',
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  return parts.join(' ');
};

export type SerpProfilePlatformQuery = 'facebook' | 'instagram' | 'linkedin';

type ApifyActorInput = {
  queries: string;
  countryCode?: string;
  languageCode?: string;
  maxPagesPerQuery?: number;
  resultsPerPage?: number;
  mobileResults?: boolean;
};

/**
 * Map Apify dataset items (nested organicResults or flat organic rows) to SerpLink list.
 */
const mapDatasetItemsToSerpLinks = (items: unknown[]): SerpLink[] => {
  const out: SerpLink[] = [];
  const seen = new Set<string>();

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;

    const organic = row.organicResults;
    if (Array.isArray(organic)) {
      for (const o of organic) {
        if (!o || typeof o !== 'object') continue;
        const org = o as Record<string, unknown>;
        const url = typeof org.url === 'string' ? org.url.trim() : '';
        const title =
          typeof org.title === 'string' ? org.title.trim().replace(/\s+/g, ' ') : '';
        if (!url || !title || seen.has(url)) continue;
        if (!url.startsWith('http')) continue;
        try {
          const host = new URL(url).hostname;
          if (host === 'google.com' || host.endsWith('.google.com')) continue;
        } catch {
          continue;
        }
        seen.add(url);
        out.push({ title, url });
      }
    }

    if (row.type === 'organic') {
      const url = typeof row.url === 'string' ? row.url.trim() : '';
      const title =
        typeof row.title === 'string' ? row.title.trim().replace(/\s+/g, ' ') : '';
      if (!url || !title || seen.has(url)) continue;
      if (!url.startsWith('http')) continue;
      try {
        const host = new URL(url).hostname;
        if (host === 'google.com' || host.endsWith('.google.com')) continue;
      } catch {
        continue;
      }
      seen.add(url);
      out.push({ title, url });
    }
  }

  return out.slice(0, 30);
};

const buildApifyRequestUrl = (): string => {
  const token = process.env.APIFY_API_TOKEN?.trim();
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not set (Apify Console → Integrations → API token)');
  }
  const u = new URL(APIFY_RUN_SYNC_DATASET_ITEMS);
  u.searchParams.set('token', token);
  u.searchParams.set('timeout', '300');
  return u.toString();
};

export type ProcessGoogleSerpScrapeInput = {
  businessName: string;
  city: string;
  state: string;
  /**
   * When set, runs a social/reviews-focused query (Facebook, Instagram, Google Maps reviews).
   * When omitted, uses generic name + location query (internal tooling only).
   */
  websiteUrlForSocialQuery?: string | null;
  /**
   * When set with `websiteUrlForSocialQuery`, uses a dedicated Google query for that profile type.
   * When omitted but website is set, uses legacy combined `buildSocialProfilesGoogleSearchQuery` (deprecated).
   */
  socialProfilesPlatform?: SerpProfilePlatformQuery;
  /**
   * When set, Apify uses this query string directly (orchestrators / one-off SERP).
   * Ignores social query builders when non-empty after trim.
   */
  queryOverride?: string | null;
};

/**
 * Fetches organic Google results via Apify (no in-house Playwright).
 */
export const processGoogleSerpScrape = async (
  input: ProcessGoogleSerpScrapeInput
): Promise<SerpLink[]> => {
  const startedAt = Date.now();
  const override = input.queryOverride?.trim();
  const website = input.websiteUrlForSocialQuery?.trim();
  const socialBase = website
    ? {
        businessName: input.businessName,
        city: input.city,
        state: input.state,
        websiteUrl: website,
      }
    : null;

  const q = override
    ? override
    : socialBase && input.socialProfilesPlatform === 'facebook'
      ? buildFacebookGoogleSearchQuery(socialBase)
      : socialBase && input.socialProfilesPlatform === 'instagram'
        ? buildInstagramGoogleSearchQuery(socialBase)
        : socialBase && input.socialProfilesPlatform === 'linkedin'
          ? buildLinkedInGoogleSearchQuery(socialBase)
          : socialBase
            ? buildSocialProfilesGoogleSearchQuery(socialBase)
            : buildGoogleWebSearchQuery(input);
  if (!q) {
    console.warn(`${LOG_PREFIX} empty query after build; skipping`);
    return [];
  }

  const socialPlatform = Boolean(input.socialProfilesPlatform);
  const body: ApifyActorInput = {
    queries: q,
    countryCode: 'us',
    languageCode: 'en',
    maxPagesPerQuery: socialPlatform ? 2 : 1,
    resultsPerPage: socialPlatform ? 20 : 10,
    mobileResults: false,
  };

  console.log(`${LOG_PREFIX} apify start query=${JSON.stringify(q)}`);

  const url = buildApifyRequestUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Apify SERP request timed out after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    console.error(`${LOG_PREFIX} apify non-JSON body`, text.slice(0, 500));
    throw new Error(`Apify returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? JSON.stringify((parsed as { error: unknown }).error)
        : text.slice(0, 400);
    console.error(`${LOG_PREFIX} apify HTTP ${res.status}`, msg);
    throw new Error(`Apify SERP failed: HTTP ${res.status} ${msg}`);
  }

  if (!Array.isArray(parsed)) {
    console.error(`${LOG_PREFIX} apify expected dataset array, got`, typeof parsed);
    throw new Error('Apify returned unexpected JSON (expected a dataset items array)');
  }

  const links = mapDatasetItemsToSerpLinks(parsed);
  console.log(
    `${LOG_PREFIX} apify collected=${links.length} totalElapsedMs=${Date.now() - startedAt}`
  );
  if (links.length > 0) {
    console.log(`${LOG_PREFIX} serp rows (all ${links.length}):`, links);
  }

  return links;
};
