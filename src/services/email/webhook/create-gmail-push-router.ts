/**
 * Gmail Pub/Sub push webhook router.
 * POST /gmail-push receives notifications; returns 200 immediately and processes async.
 */

import { Router, Request, Response } from 'express';
import { processGmailPushNotification } from './process-gmail-push';

type PubSubMessage = {
  data?: string;
  messageId?: string;
  publishTime?: string;
};

type PubSubBody = {
  message?: PubSubMessage;
  subscription?: string;
};

export const createGmailPushRouter = (): Router => {
  const router = Router();

  router.post('/gmail-push', async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as PubSubBody;
      const message = body?.message;
      const data = message?.data;

      if (!data) {
        console.warn('Gmail push: missing message.data');
        res.status(200).json({ success: false, error: 'Missing message.data' });
        return;
      }

      res.status(200).json({ success: true });

      setImmediate(() => {
        processGmailPushNotification(data).catch((e) => {
          console.error('Gmail push: async process error:', e);
        });
      });
    } catch (e) {
      console.error('Gmail push: handler error:', e);
      res.status(200).json({ success: false });
    }
  });

  return router;
};
