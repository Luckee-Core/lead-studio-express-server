import type { SummarizeBusinessOverviewRequest } from './types';

/** Cap total crawl text in the user message to stay within model context. */
const MAX_TOTAL_CHARS = 100_000;
const MAX_PER_PAGE_CHARS = 28_000;

const truncate = (s: string, max: number): string => {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[…truncated…]`;
};

/**
 * Build prompts: short owner blurb + labeled facts for CRM (no sales "opportunities" list).
 */
export const buildSummarizeBusinessOverviewPrompt = (
  request: SummarizeBusinessOverviewRequest
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You analyze small-business websites and return JSON for a CRM used by local business owners and their reps.

Audience: Busy owners — plain language, no buzzwords.

Output:
Return ONLY valid JSON. No markdown fences, no text before or after.

Required keys:
- quick_take: string — Exactly 2–3 sentences (under ~450 characters). What they do, who they serve, one differentiator if clear. Like briefing a friend.

- facts: object — Short string values for each field below. Use "Unknown" only when the crawl gives no usable signal (do not guess locations or credentials).
  - residential_vs_commercial: e.g. "Residential only", "Commercial only", "Both", "Industrial", "Unknown"
  - business_model: e.g. "B2B", "B2C", "Mixed", "Unknown"
  - primary_services: one tight line (what they sell/do most)
  - service_area: cities, region, or "National" / "Unknown" if not stated
  - years_in_business: e.g. "Since 1993" or "Unknown"
  - team_size: e.g. "1–10", "50+", "Unknown" — only if hinted on site
  - certifications_or_licenses: short line or "Not stated"

- concerns: string[] — 0–4 optional site-quality notes (thin content, outdated, etc.). Empty array if none.

Rules:
1) Grounding: Do not invent phone, email, URLs, awards, or locations not in the crawl.
2) facts values must be short (typically under 120 characters each).
3) Do not include separate "opportunities", "highlights", or sales pitches — only facts and optional concerns.`;

  const headerLines = [
    `Business name (from CRM): ${request.businessName.trim() || '(unknown)'}`,
    request.address?.trim()
      ? `Address (from CRM): ${request.address.trim()}`
      : 'Address (from CRM): (none)',
    '',
    'Website content (markdown) by page URL:',
    '',
  ];

  let budget = MAX_TOTAL_CHARS - headerLines.join('\n').length - 200;
  const sections: string[] = [];

  for (const page of request.pages) {
    if (budget <= 0) break;
    const blockHeader = `---\nURL: ${page.url}\nTitle: ${page.title}\n---\n`;
    const body = truncate(page.markdown, Math.min(MAX_PER_PAGE_CHARS, budget));
    const chunk = blockHeader + body;
    sections.push(chunk);
    budget -= chunk.length;
  }

  const userMessage = `${headerLines.join('\n')}${sections.join('\n\n')}`;

  return { systemPrompt, userMessage };
};
