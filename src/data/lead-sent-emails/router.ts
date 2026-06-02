/**
 * Lead Sent Emails Router
 * GET /api/data/lead-sent-emails
 */

import { Router, Request, Response } from 'express';
import { getAllLeadSentEmails } from './index';

export const createLeadSentEmailsRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data/lead-sent-emails
   * Retrieves all lead sent emails (enriched with lead_id from lead_contacts).
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const sentEmails = await getAllLeadSentEmails(supabase);

      res.status(200).json({
        success: true,
        data: sentEmails,
        count: sentEmails.length,
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-sent-emails:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
