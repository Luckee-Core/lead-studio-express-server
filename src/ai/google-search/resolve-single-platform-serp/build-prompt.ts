import type { ResolveSinglePlatformSerpRequest } from './types';

const platformLabel = (p: ResolveSinglePlatformSerpRequest['platform']): string => {
  if (p === 'facebook') return 'Facebook';
  if (p === 'instagram') return 'Instagram';
  return 'LinkedIn';
};

const platformRules = (p: ResolveSinglePlatformSerpRequest['platform']): string => {
  if (p === 'facebook') {
    return `The URL must be on facebook.com (or m.facebook.com) — an official Page or profile for this business. Strip tracking params. If no row clearly matches this business at this location, return null.`;
  }
  if (p === 'instagram') {
    return `The URL must be on instagram.com — the business profile root (https://www.instagram.com/<handle>/). If a row is a reel or post, normalize to the profile URL. If unsure, null.`;
  }
  return `The URL must be on linkedin.com — a company or showcase page for this brand when clearly this entity. Many small businesses have none — use null.`;
};

/**
 * Build prompts: pick at most one official profile URL for a single platform from SERP rows only.
 */
export const buildResolveSinglePlatformSerpPrompt = (
  request: ResolveSinglePlatformSerpRequest
): { systemPrompt: string; userMessage: string } => {
  const label = platformLabel(request.platform);
  const systemPrompt = `You match one real-world business to at most one ${label} URL from a Google search results page.

Input:
You receive a JSON array of SERP rows (title + url only) from a Google query already focused on ${label} for this business.

Goal:
Pick the single best official ${label} URL for this business, or null if none of the rows clearly match.

Output format:
Return ONLY a valid JSON object. No markdown, no code fences, no prose before or after.
Required keys:
- url: string | null — ${platformRules(request.platform)}

Rules:
1) Entity match: Only assign a URL if the row title and URL clearly refer to the same business and location given. Reject other cities, unrelated brands, or generic pages.
2) Use only URLs that appear in the input SERP rows (or normalize an Instagram post URL to its profile if the post URL is in the input).
3) Return https URLs. Strip tracking query params (utm_*, srsltid, etc.) when safe.`;

  const rowsJson = JSON.stringify(
    request.results.map((r) => ({ title: r.title, url: r.url })),
    null,
    2
  );

  const hostNote =
    request.knownWebsiteHost?.trim() ?
      `\n- Known business website host (from CRM, for disambiguation only): ${request.knownWebsiteHost.trim()}`
    : '';

  const userMessage = `Business:
- Name: ${request.businessName.trim()}
- City: ${request.city.trim()}
- State: ${request.state.trim()}${hostNote}
- Platform: ${label}

SERP rows (JSON array — use only these):
${rowsJson}

Return the single JSON object with key "url".`;

  return { systemPrompt, userMessage };
};
