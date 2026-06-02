import { Router } from 'express';
import { renewGmailWatchHandler } from './renew-gmail-watch';

/**
 * Cron-only HTTP surface (e.g. Gmail watch). Lead research: /api/services/*.
 */
export const createCronRouter = (): Router => {
  const router = Router();
  router.post('/renew-gmail-watch', renewGmailWatchHandler);
  return router;
};
