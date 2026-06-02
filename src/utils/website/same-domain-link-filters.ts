/**
 * Shared rules for same-domain URL normalization and third-party host blocking.
 * Used by fetch-based discovery and Playwright nav/footer link harvesting.
 */

/** Host substrings we never treat as same-site navigation targets. */
export const SOCIAL_OR_DIRECTORY_HOST_SUBSTRINGS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'yelp.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'tiktok.com',
] as const;

/**
 * Parse a user-entered website string into an absolute http(s) URL.
 */
export const parseToHttpUrl = (raw: string): URL | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    return new URL(withProto);
  } catch {
    return null;
  }
};

/**
 * Lowercase host without leading `www.`.
 */
export const normalizeHostForSameDomain = (host: string): string =>
  host.toLowerCase().replace(/^www\./, '');

/**
 * Strip hash; trim trailing slash on non-root paths for stable dedupe.
 */
export const normalizeHttpUrlString = (candidate: URL): string => {
  const normalized = new URL(candidate.toString());
  normalized.hash = '';
  if (normalized.pathname !== '/') {
    normalized.pathname = normalized.pathname.replace(/\/+$/, '');
  }
  return normalized.toString();
};

/**
 * True when hostname matches known social / directory properties.
 */
export const isDisallowedExternalHost = (host: string): boolean => {
  return SOCIAL_OR_DIRECTORY_HOST_SUBSTRINGS.some((blocked) => host.includes(blocked));
};

/**
 * True when candidate host equals base or is a subdomain of base.
 */
export const isSameDomainOrSubdomain = (candidateHost: string, baseHost: string): boolean => {
  return candidateHost === baseHost || candidateHost.endsWith(`.${baseHost}`);
};
