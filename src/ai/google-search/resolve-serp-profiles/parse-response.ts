import { ResolvedSerpProfiles, ResolveSerpProfilesResponse } from './types';

const stripCodeFences = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
  return text.trim().replace(/,(\s*})/g, '$1').replace(/,(\s*])/g, '$1');
};

const normalizeNullableUrl = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t || t.toLowerCase() === 'null' || t.toLowerCase() === 'none') return null;
  try {
    const u = new URL(t.startsWith('http') ? t : `https://${t}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return out.length > 0 ? out : undefined;
};

/** Normalize URL list; dedupe; drop invalid entries. */
const normalizeUrlArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const u = normalizeNullableUrl(item);
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
};

/**
 * Parse Haiku JSON output into ResolvedSerpProfiles.
 */
export const parseResolveSerpProfilesResponse = (
  aiResponse: string
): ResolveSerpProfilesResponse => {
  try {
    const text = stripCodeFences(aiResponse);
    const parsed = JSON.parse(text) as Record<string, unknown>;

    const primaryWebsiteUrl = normalizeNullableUrl(
      parsed.primaryWebsiteUrl ?? parsed.primary_website_url ?? parsed.websiteUrl
    );

    const profiles: ResolvedSerpProfiles = {
      primaryWebsiteUrl,
      relevantWebsiteUrls: normalizeUrlArray(
        parsed.relevantWebsiteUrls ?? parsed.relevant_website_urls ?? []
      ),
      facebookUrl: normalizeNullableUrl(parsed.facebookUrl ?? parsed.facebook_url),
      instagramUrl: normalizeNullableUrl(parsed.instagramUrl ?? parsed.instagram_url),
      linkedinUrl: normalizeNullableUrl(parsed.linkedinUrl ?? parsed.linkedin_url),
      googleReviewsUrl: normalizeNullableUrl(
        parsed.googleReviewsUrl ?? parsed.google_reviews_url ?? parsed.googleMapsUrl
      ),
      yelpUrl: normalizeNullableUrl(parsed.yelpUrl ?? parsed.yelp_url),
    };

    const notes = typeof parsed.notes === 'string' ? parsed.notes.trim() : undefined;
    if (notes) profiles.notes = notes;

    const rejectedUrls = normalizeStringArray(parsed.rejectedUrls ?? parsed.rejected_urls);
    if (rejectedUrls) profiles.rejectedUrls = rejectedUrls;

    const reserved = new Set<string>(
      [
        profiles.primaryWebsiteUrl,
        profiles.facebookUrl,
        profiles.instagramUrl,
        profiles.linkedinUrl,
        profiles.googleReviewsUrl,
        profiles.yelpUrl,
      ].filter((u): u is string => Boolean(u))
    );
    profiles.relevantWebsiteUrls = profiles.relevantWebsiteUrls.filter((u) => !reserved.has(u));

    return { success: true, profiles };
  } catch (error) {
    return {
      success: false,
      profiles: null,
      error: error instanceof Error ? error.message : 'Failed to parse AI response',
    };
  }
};
