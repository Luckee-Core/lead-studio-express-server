import { Router, Request, Response } from 'express';
import { routeParam } from '../../utils/express/route-param';
import { createToCallLog } from './create';
import { deleteToCallLog } from './delete';
import { getAllToCallLog } from './get-all';
import { updateToCallLog } from './update';
import type {
  CreateToCallLogInput,
  ToCallLogStatus,
  UpdateToCallLogInput,
} from './types';

export const createToCallLogRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const items = await getAllToCallLog(supabase, {
        lead_id: req.query.lead_id as string | undefined,
        lead_contact_id: req.query.lead_contact_id as string | undefined,
        lead_contact_email_queue_id: req.query
          .lead_contact_email_queue_id as string | undefined,
        call_status: req.query.call_status as ToCallLogStatus | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });

      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      console.error('❌ GET /api/data/to-call-log:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body as CreateToCallLogInput;
      const notes = input?.notes?.trim();
      if (
        !input?.lead_id ||
        !input?.lead_contact_id ||
        !notes
      ) {
        res.status(400).json({
          success: false,
          error: 'lead_id, lead_contact_id, and notes are required',
        });
        return;
      }

      const supabase = req.supabase;
      const created = await createToCallLog(supabase, {
        ...input,
        notes,
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      console.error('❌ POST /api/data/to-call-log:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const id = routeParam(req.params.id);
      if (!id) {
        res.status(400).json({ success: false, error: 'id is required' });
        return;
      }

      const body = req.body as UpdateToCallLogInput;
      const hasNotes = body.notes !== undefined;
      const hasCallNotes = body.call_notes !== undefined;
      const hasStatus = body.call_status !== undefined;
      const hasCalledAt = body.called_at !== undefined;
      if (!hasNotes && !hasCallNotes && !hasStatus && !hasCalledAt) {
        res.status(400).json({
          success: false,
          error:
            'Provide notes, call_notes, call_status, and/or called_at to update',
        });
        return;
      }

      const supabase = req.supabase;
      const updated = await updateToCallLog(supabase, id, body);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error('❌ PATCH /api/data/to-call-log/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const id = routeParam(req.params.id);
      if (!id) {
        res.status(400).json({ success: false, error: 'id is required' });
        return;
      }

      const supabase = req.supabase;
      await deleteToCallLog(supabase, id);

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error('❌ DELETE /api/data/to-call-log/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
