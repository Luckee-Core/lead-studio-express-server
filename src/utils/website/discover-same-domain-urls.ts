import {
  isDisallowedExternalHost,
  isSameDomainOrSubdomain,
  normalizeHostForSameDomain,
  normalizeHttpUrlString,
  parseToHttpUrl,
} from './same-domain-link-filters';

const MAX_DISCOVERED_URLS = 4;
const PROBE_TIMEOUT_MS = 8000;
const HOMEPAGE_LINK_SCAN_LIMIT = 60;
const CANDIDATE_PATHS = ['/about', '/contact', '/services', '/service'] as const;

const extractHrefValues = (html: string): string[] => {
  const out: string[] = [];
  const hrefRegex = /href\s*=\s*["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null = hrefRegex.exec(html);
  while (match && out.length < HOMEPAGE_LINK_SCAN_LIMIT) {
    if (typeof match[1] === 'string' && match[1].trim()) {
      out.push(match[1].trim());
    }
    match = hrefRegex.exec(html);
  }
  return out;
};

const buildHomepageCandidates = async (baseUrl: URL): Promise<string[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(baseUrl.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('text/html')) return [];

    const html = await res.text();
    const hrefs = extractHrefValues(html);
    const baseHost = normalizeHostForSameDomain(baseUrl.hostname);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const href of hrefs) {
      let candidate: URL;
      try {
        candidate = new URL(href, baseUrl);
      } catch {
        continue;
      }
      if (!['http:', 'https:'].includes(candidate.protocol)) continue;
      const candidateHost = normalizeHostForSameDomain(candidate.hostname);
      if (!isSameDomainOrSubdomain(candidateHost, baseHost)) continue;
      if (isDisallowedExternalHost(candidateHost)) continue;
      const normalized = normalizeHttpUrlString(candidate);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(normalized);
      if (out.length >= HOMEPAGE_LINK_SCAN_LIMIT) break;
    }
    return out;
  } catch {
    return [];
  }
};

const probeCandidate = async (raw: string, baseHost: string): Promise<string | null> => {
  let candidate: URL;
  try {
    candidate = new URL(raw);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(candidate.protocol)) return null;
  const candidateHost = normalizeHostForSameDomain(candidate.hostname);
  if (!isSameDomainOrSubdomain(candidateHost, baseHost)) return null;
  if (isDisallowedExternalHost(candidateHost)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(candidate.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('text/html')) return null;
    const body = await res.text();
    if (body.replace(/\s+/g, ' ').trim().length < 200) return null;
    return normalizeHttpUrlString(new URL(res.url || candidate.toString()));
  } catch {
    return null;
  }
};

/**
 * Discover up to 4 same-domain URLs from a primary website.
 */
export const discoverSameDomainUrls = async (primaryWebsite: string): Promise<string[]> => {
  const baseUrl = parseToHttpUrl(primaryWebsite);
  if (!baseUrl) return [];
  const baseHost = normalizeHostForSameDomain(baseUrl.hostname);
  if (!baseHost) return [];

  const seededCandidates = CANDIDATE_PATHS.map((path) => {
    const u = new URL(baseUrl.toString());
    u.pathname = path;
    u.search = '';
    u.hash = '';
    return normalizeHttpUrlString(u);
  });

  const homepageCandidates = await buildHomepageCandidates(baseUrl);
  const queue = [...seededCandidates, ...homepageCandidates];

  const out: string[] = [];
  const seen = new Set<string>();
  for (const candidate of queue) {
    if (out.length >= MAX_DISCOVERED_URLS) break;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const probed = await probeCandidate(candidate, baseHost);
    if (!probed) continue;
    const probedUrl = new URL(probed);
    const baseNoWww = normalizeHostForSameDomain(baseUrl.hostname);
    const probedNoWww = normalizeHostForSameDomain(probedUrl.hostname);
    const isRootPath = probedUrl.pathname === '/' || probedUrl.pathname === '';
    if (probedNoWww === baseNoWww && isRootPath) continue;
    out.push(probed);
  }

  return out;
};
