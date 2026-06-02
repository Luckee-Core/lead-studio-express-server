/**
 * Lead Contact Email Queue Router
 * GET /, POST /, DELETE /:id, POST /process-next, POST /process-due
 */

import { Router, Request, Response } from 'express';
import { getAllQueueItems } from './get-all';
import { deleteQueueItem } from './delete';
import { addToQueue } from '../../services/lead-contact-email-queue/add-to-queue';
import { processNextQueueItem } from '../../services/lead-contact-email-queue/process-next-queue-item';
import { processDueQueueItems } from '../../services/lead-contact-email-queue/process-due-queue-items';
export const createLeadContactEmailQueueRouter = (): Router => {
  const router = Router();

  /**
   * POST /api/data/lead-contact-email-queue
   * Enqueues a lead contact to send a specific draft (lead_contact_email) later.
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = (req as any).supabase;
      const body = req.body as {
        lead_contact_id?: string;
        persona_id?: string | null;
        campaign_id?: string | null;
        lead_contact_email_id?: string;
        schedule_for?: 'default' | 'today' | 'tomorrow' | 'date';
        schedule_date?: string;
      };

      if (!body?.lead_contact_id || typeof body.lead_contact_id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'lead_contact_id is required',
        });
        return;
      }

      if (!body.lead_contact_email_id || typeof body.lead_contact_email_id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'lead_contact_email_id is required',
        });
        return;
      }

      let scheduleFor: 'default' | 'today' | 'tomorrow' | 'date' = 'default';
      if (
        body.schedule_for === 'default' ||
        body.schedule_for === 'today' ||
        body.schedule_for === 'tomorrow' ||
        body.schedule_for === 'date'
      ) {
        scheduleFor = body.schedule_for;
      }

      if (scheduleFor === 'date' && (!body.schedule_date || typeof body.schedule_date !== 'string')) {
        res.status(400).json({
          success: false,
          error: 'schedule_date is required when schedule_for is date (YYYY-MM-DD, Eastern)',
        });
        return;
      }

      const result = await addToQueue(supabase, body.lead_contact_id, {
        persona_id: body.persona_id ?? null,
        campaign_id: body.campaign_id,
        lead_contact_email_id: body.lead_contact_email_id,
        schedule_for: scheduleFor,
        schedule_date:
          scheduleFor === 'date' && typeof body.schedule_date === 'string'
            ? body.schedule_date
            : undefined,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error ?? 'Failed to add to queue',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.queueItem,
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-contact-email-queue:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * GET /api/data/lead-contact-email-queue
   * Retrieves queue items with optional query filters
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = (req as any).supabase;
      const filters = {
        status: req.query.status as string | undefined,
        lead_id: req.query.lead_id as string | undefined,
        lead_contact_id: req.query.lead_contact_id as string | undefined,
        campaign_id: req.query.campaign_id as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        offset: req.query.offset
          ? parseInt(req.query.offset as string, 10)
          : undefined,
      };

      const items = await getAllQueueItems(supabase, filters);

      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-contact-email-queue:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * DELETE /api/data/lead-contact-email-queue/:id
   * Deletes a queue item by ID
   */
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid queue item ID',
        });
        return;
      }

      const supabase = (req as any).supabase;
      await deleteQueueItem(supabase, id);

      res.status(200).json({
        success: true,
        message: 'Queue item deleted successfully',
      });
    } catch (error) {
      console.error('❌ DELETE /api/data/lead-contact-email-queue/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * POST /api/data/lead-contact-email-queue/process-next
   * Processes the next queued item (force send; skips business-hours gate).
   */
  router.post('/process-next', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = (req as any).supabase;
      const result = await processNextQueueItem(supabase);
      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-contact-email-queue/process-next:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * POST /api/data/lead-contact-email-queue/process-due
   * Processes due queued items (business hours, batch). Used by Supabase cron / Edge Function.
   */
  router.post('/process-due', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = (req as any).supabase;
      const result = await processDueQueueItems(supabase);
      res.status(200).json({
        success: result.success,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        errors: result.errors,
        middayPause: result.middayPause,
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-contact-email-queue/process-due:', error);
      res.status(500).json({
        success: false,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      });
    }
  });

  return router;
};
