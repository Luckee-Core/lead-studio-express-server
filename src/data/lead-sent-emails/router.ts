/**
 * Lead Sent Emails Router
 * GET /api/data/lead-sent-emails
 * DELETE /api/data/lead-sent-emails/:id
 */

import { Router, Request, Response } from 'express';
import { deleteLeadSentEmail } from './delete';
import { getAllLeadSentEmails } from './get-all';

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

  /**
   * DELETE /api/data/lead-sent-emails/:id
   * Deletes a lead sent email record.
   */
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid sent email ID',
        });
        return;
      }

      const supabase = req.supabase;
      await deleteLeadSentEmail(supabase, id);

      res.status(200).json({
        success: true,
        message: 'Lead sent email deleted successfully',
      });
    } catch (error) {
      console.error('❌ DELETE /api/data/lead-sent-emails/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
