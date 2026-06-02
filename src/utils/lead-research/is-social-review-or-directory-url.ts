/**
 * Hostnames/patterns that must never be stored as the lead's "website" — they belong in
 * social/review fields or are third-party listings, not the business's own domain.
 */
const SOCIAL_REVIEW_DIRECTORY_HOST_SUFFIXES: readonly string[] = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'threads.net',
  'tiktok.com',
  'pinterest.com',
  'youtube.com',
  'youtu.be',
  'nextdoor.com',
  'yelp.com',
  'tripadvisor.com',
  'bbb.org',
  'houzz.com',
  'angi.com',
  'homeadvisor.com',
  'manta.com',
  'foursquare.com',
  'yellowpages.com',
  'yellowpages.ca',
  'mapquest.com',
  'superpages.com',
  'chamberofcommerce.com',
  'grubhub.com',
  'doordash.com',
  'ubereats.com',
  'reddit.com',
];

const hostEndsWith = (host: string, suffix: string): boolean =>
  host === suffix || host.endsWith(`.${suffix}`);

/**
 * True if this URL is clearly a social profile, review portal, maps listing, or directory —
 * not the business's own marketing website hostname.
 */
export const isSocialReviewOrDirectoryUrl = (urlString: string): boolean => {
  const raw = urlString.trim();
  if (!raw) return true;
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    for (const suffix of SOCIAL_REVIEW_DIRECTORY_HOST_SUFFIXES) {
      if (hostEndsWith(host, suffix)) return true;
    }

    if (hostEndsWith(host, 'google.com')) {
      const p = u.pathname.toLowerCase();
      if (
        p.includes('/maps/') ||
        p.startsWith('/maps') ||
        p.includes('/local/') ||
        p.includes('/url') ||
        host.startsWith('maps.google')
      ) {
        return true;
      }
    }
    if (host === 'maps.google.com' || host === 'business.google.com') return true;
    if (host === 'g.page' || host === 'goo.gl' || host === 'maps.app.goo.gl') return true;

    return false;
  } catch {
    return true;
  }
};
