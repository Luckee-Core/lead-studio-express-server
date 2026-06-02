import { ResolveSerpProfilesRequest } from './types';

/**
 * Build Haiku prompts: classify first-page SERP rows into owned website URLs vs social/review listings.
 */
export const buildResolveSerpProfilesPrompt = (
  request: ResolveSerpProfilesRequest
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You match a single real-world business to URLs found on a Google search results page.

Input:
You will receive a JSON array of SERP rows (title + url only), already retrieved from Google. Your job is to classify each useful URL into the right field and reject wrong-entity noise.

Goal:
1) Pick the business's own marketing website (their domain) and any extra pages on that same site.
2) Pick at most one URL per social/review category below — never put socials or third-party listings into the website fields.

Output format:
Return ONLY a valid JSON object. No markdown, no code fences, no prose before or after.
Required keys:
- primaryWebsiteUrl: string | null — The business's own marketing website (homepage or main branded site on their domain). Must be a URL they own (e.g. www.example.com or example.com). If the official site does not appear in the SERP rows, null. Never use Facebook, Instagram, Yelp, Google Maps, Houzz, BBB, Yellow Pages, Mapquest, or any other directory/review/social host as primaryWebsiteUrl.
- relevantWebsiteUrls: string[] — Zero or more additional URLs that are still on the SAME business-owned domain as primaryWebsiteUrl (e.g. /contact, /about, /services, or a subdomain like shop.example.com) when those rows appear in the input. Do NOT put Houzz, BBB, Yelp, social networks, or other third-party sites here — those are not "extra pages" of the business website. If no extra paths on the owned domain appear in SERP, use []. Do not duplicate primaryWebsiteUrl or any URL in social/review fields.
- facebookUrl: string | null
- instagramUrl: string | null
- linkedinUrl: string | null
- googleReviewsUrl: string | null
- yelpUrl: string | null
Optional keys:
- notes: string (brief, optional)
- rejectedUrls: string[] (URLs from the input you are confident are NOT this business; optional)

Rules:
1) Entity match: Only assign a URL if the row title and URL clearly refer to the same business and location given. Reject different venues, other cities, unrelated brands, parody pages, or generic search result pages.
2) Website fields vs social/listings: primaryWebsiteUrl and relevantWebsiteUrls must contain ONLY the business's own site (owned domain). All Facebook, Instagram, LinkedIn, Yelp, Google Maps/reviews, Houzz, BBB, directories, and delivery apps go ONLY in the dedicated social/review keys — never in primaryWebsiteUrl or relevantWebsiteUrls.
3) Facebook: facebook.com pages/profiles for this business.
4) Instagram: instagram.com profile for this business. If a row is a reel/post URL, normalize to the profile root (https://www.instagram.com/<handle>/).
5) LinkedIn: company or showcase pages only when clearly this brand. Many small businesses have none — use null.
6) Yelp: prefer the canonical /biz/... business page. Do NOT use yelp.com/search. If two Yelp rows differ only by ?start= pagination, pick one canonical biz URL without pagination params when possible.
7) Google reviews: google.com/maps/place/..., maps.google.com, g.page/..., or maps.app.goo.gl only when clearly this business's listing. If unsure, null.
8) Drop noise: TripAdvisor, DoorDash/Uber Eats/Grubhub, local BID/chamber listicles, unrelated blogs, duplicate Yelp photo pages unless they are the only biz page.
9) URLs: return https URLs. Strip tracking query params when safe (e.g. srsltid, utm_*). Remove fragment-only text-fragment suffixes like #:~:text=... from the path/query if present.`;

  const rowsJson = JSON.stringify(
    request.results.map((r) => ({ title: r.title, url: r.url })),
    null,
    2
  );

  const serpNote = request.socialReviewsSerp
    ? '\n- Note: These results come from a Google query focused on Facebook, Instagram, and Google Maps/reviews for this business. The official website may not appear; still extract facebookUrl, instagramUrl, googleReviewsUrl, linkedinUrl when clearly this entity.'
    : '';

  const hostNote =
    request.knownWebsiteHost?.trim() ?
      `\n- Known business website host (from CRM, for disambiguation only): ${request.knownWebsiteHost.trim()}`
    : '';

  const userMessage = `Business:
- Name: ${request.businessName.trim()}
- City: ${request.city.trim()}
- State: ${request.state.trim()}${hostNote}${serpNote}

First-page SERP rows (JSON array):
${rowsJson}

Return the single JSON object as specified.`;

  return { systemPrompt, userMessage };
};
