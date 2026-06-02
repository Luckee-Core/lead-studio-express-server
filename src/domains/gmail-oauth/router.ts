import { Router } from 'express';
import * as handlers from './routes';

/**
 * Gmail OAuth connect/callback/status/disconnect (per Supabase user).
 */
export const createGmailOauthRouter = (): Router => {
  const router = Router();

  router.post('/start', handlers.postStartHandler);
  router.get('/callback', handlers.getCallbackHandler);
  router.get('/status', handlers.getStatusHandler);
  router.post('/disconnect', handlers.postDisconnectHandler);

  return router;
};
