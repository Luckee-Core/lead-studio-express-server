import type { Request } from 'express';

export type FacebookPostsResearchStep = 'full' | 'fetch_posts' | 'score_posts';

/**
 * Reads optional `step` from JSON body for manual Facebook posts research.
 * Cron / empty body uses `full` (scrape + AI in one run).
 */
export const getFacebookPostsResearchStepFromBody = (req: Request): FacebookPostsResearchStep => {
  const body = req.body;
  if (!body || typeof body !== 'object') return 'full';
  const s = (body as { step?: unknown }).step;
  if (s === 'fetch_posts' || s === 'score_posts') return s;
  return 'full';
};
