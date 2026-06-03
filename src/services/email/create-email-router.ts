/**
 * Email Router — service-account test send (CRON_SECRET when set).
 */

import { Router, Request, Response } from 'express';
import { sendTestEmail } from './send-test-email';
import { openTrackingHandler } from './routes/open-tracking-handler';
import { verifyCronSecret } from '../lead-research-shared';

export const createEmailRouter = (): Router => {
  const router = Router();

  /**
   * GET /open
   * Open-tracking pixel. Query: t (open_tracking_token). Returns 1×1 GIF or redirects when EMAIL_OPEN_TRACKING_REDIRECT_URL is set.
   */
  router.get('/open', openTrackingHandler);

  /**
   * POST /test
   * Send a test email via Workspace service account.
   * Body: { to: string, subject?: string, message?: string }
   * Auth: Bearer CRON_SECRET or x-cron-secret when CRON_SECRET is set.
   */
  router.post('/test', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!verifyCronSecret(req)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { to, subject, message } = req.body;

      if (!to) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: to',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
        return;
      }

      await sendTestEmail({ to, subject, message });

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: { to, subject: subject || 'Test Email (Lead Studio)' },
      });
    } catch (error: unknown) {
      console.error('❌ Error in POST /api/email/test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        error: errorMessage,
        message: 'Failed to send test email',
      });
    }
  });

  return router;
};
