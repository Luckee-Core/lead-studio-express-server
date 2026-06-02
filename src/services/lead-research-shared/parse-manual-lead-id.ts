import type { Request } from 'express';

/**
 * When JSON body includes `leadId`, lead research runs for that lead only (manual / app UI).
 * Lead Google search no longer supports cron without `leadId` — those requests are skipped.
 */
export const getManualLeadIdFromBody = (req: Request): string | null => {
  const body = req.body;
  if (!body || typeof body !== 'object') return null;
  const id = (body as { leadId?: unknown }).leadId;
  if (typeof id !== 'string') return null;
  const t = id.trim();
  return t.length > 0 ? t : null;
};

/**
 * When `force: true`, manual Facebook posts research re-runs Apify even if a succeeded row exists.
 */
export const getForceFacebookPostsResearchFromBody = (req: Request): boolean => {
  const body = req.body;
  if (!body || typeof body !== 'object') return false;
  return (body as { force?: unknown }).force === true;
};
