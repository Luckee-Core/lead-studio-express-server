/**
 * True when a SERP URL is plausibly a Facebook Page/profile (not login, watch, marketplace, etc.).
 */
export const urlLooksLikeFacebookProfileOrPage = (rawUrl: string): boolean => {
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = u.hostname.toLowerCase();
    if (!host.includes('facebook.com') && !host.endsWith('.fb.com')) return false;
    const path = (u.pathname.replace(/\/+$/, '') || '/').toLowerCase();
    if (path === '/') return false;
    const blockedPrefixes = [
      '/login',
      '/recover',
      '/reg/',
      '/settings',
      '/help',
      '/policies',
      '/privacy',
      '/watch',
      '/reel',
      '/marketplace',
      '/gaming',
      '/events/',
      '/ads',
      '/business',
      '/sharer',
      '/plugins',
      '/dialog',
      '/images',
      '/photo',
      '/videos',
    ];
    if (blockedPrefixes.some((b) => path.startsWith(b))) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Stable key for deduping the same Page across mobile/www and query variants.
 */
export const facebookSerpCanonicalKey = (rawUrl: string): string | null => {
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = u.hostname.toLowerCase().replace(/^m\./, 'www.');
    u.search = '';
    u.hash = '';
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${host}${path}`;
  } catch {
    return null;
  }
};
