import type { Request } from 'express';

/**
 * Validates CRON_SECRET when set. If unset, allows the request (local dev).
 */
export const verifyCronSecret = (req: Request): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization;
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  const x = req.headers['x-cron-secret'];
  const xVal = typeof x === 'string' ? x : Array.isArray(x) ? x[0] : undefined;
  return bearer === secret || xVal === secret;
};
