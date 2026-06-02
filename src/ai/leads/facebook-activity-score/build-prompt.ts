import type { FacebookActivityScoreInput } from './types';

const RUBRIC = `Scoring rubric (0–100) — use only the posts provided:
- No usable posts or cannot determine dates: 0–10
- Newest post older than 90 days: 0–20
- Newest post 30–90 days ago: 20–40
- Roughly monthly cadence (avg gap ~25–45 days): 40–55
- Biweekly (~10–24 days between posts): 55–75
- Weekly (~5–9 days): 75–88
- Multiple posts per week or daily: 88–100
If fewer than 5 posts exist, score from what you have and lower confidence. Do not invent dates.`;

/**
 * System + user content for Facebook posting cadence score.
 */
export const buildFacebookActivityScorePrompt = (
  input: FacebookActivityScoreInput
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You score how actively a public Facebook Page posts, for B2B outreach prioritization.
${RUBRIC}
Respond with ONLY valid JSON (no markdown fence) matching this shape:
{"activityScore":number,"confidence":"low"|"medium"|"high","postingPattern":string,"evidence":string,"limitations":string}
activityScore must be an integer from 0 through 100.`;

  const userMessage = `Business name: ${input.businessName}
Facebook page URL: ${input.pageUrl}

Posts (newest first if dates are present; otherwise order as given):
${JSON.stringify(input.posts, null, 2)}`;

  return { systemPrompt, userMessage };
};
