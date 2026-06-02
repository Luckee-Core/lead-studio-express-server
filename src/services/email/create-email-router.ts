/**
 * Email Router
 * Provides endpoints for email functionality
 */

import { Router, Request, Response } from 'express';
import { sendTestEmailAsOAuthUser, GMAIL_NOT_CONNECTED_CODE } from './send-test-email';
import { getSupabaseUserFromRequest } from '../../utils/auth';

type SupabaseRequest = Request & { supabase: any };

export const createEmailRouter = (): Router => {
  const router = Router();

  /**
   * POST /test
   * Send a test email from the authenticated user's connected Gmail (OAuth only).
   * Request body: { to: string, subject?: string, message?: string }
   */
  router.post('/test', async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getSupabaseUserFromRequest(req);
      if (!user?.id) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Sign in required to send email',
        });
        return;
      }

      const { to, subject, message } = req.body;

      if (!to) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: to',
          message: 'Please provide an email address in the "to" field',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
          message: 'Please provide a valid email address',
        });
        return;
      }

      const supabase = (req as SupabaseRequest).supabase;

      await sendTestEmailAsOAuthUser({
        supabase,
        userId: user.id,
        to,
        subject,
        message,
      });

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          to,
          subject: subject || 'Test email (Luckee)',
        },
      });
    } catch (error: unknown) {
      console.error('Error in POST /api/email/test:', error);

      if (error instanceof Error && (error as Error & { code?: string }).code === GMAIL_NOT_CONNECTED_CODE) {
        res.status(400).json({
          success: false,
          error: GMAIL_NOT_CONNECTED_CODE,
          message: 'Connect Gmail in Settings before sending email',
        });
        return;
      }

      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const err = error as { code?: number; response?: { status?: number } };
      const statusCode = err?.code === 401 ? 401 : err?.response?.status ?? 500;

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: 'Failed to send test email',
      });
    }
  });

  return router;
};
