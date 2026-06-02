/**
 * Dev Auth Middleware
 * Bypasses authentication in development mode
 */

import { Request, Response, NextFunction } from 'express';
import { DEV_USER } from './dev-user';

const headerString = (value: string | string[] | undefined): string | undefined => {
  if (value === undefined) return undefined;
  const s = Array.isArray(value) ? value[0] : value;
  const t = typeof s === 'string' ? s.trim() : '';
  return t.length > 0 ? t : undefined;
};

/**
 * In non-production, fill missing user headers so local/curl flows work.
 * If the client already sends x-user-id (e.g. luckee-web with the signed-in user), do not overwrite.
 */
export const devAuthBypass = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!headerString(req.headers['x-user-id'])) {
      req.headers['x-user-id'] = DEV_USER.id;
    }
    if (!headerString(req.headers['x-user-email'])) {
      req.headers['x-user-email'] = DEV_USER.email;
    }
  }
  next();
};

/**
 * Extract user ID from request
 */
export const getUserId = (req: Request): string | null => {
  const userId = req.headers['x-user-id'] as string;
  return userId || null;
};

/**
 * Require user authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  next();
};

