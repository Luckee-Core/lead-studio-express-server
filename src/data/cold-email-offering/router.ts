import { Router, Request, Response } from 'express';
import { getDefaultTenantUserId } from '../users/get-default-tenant-user-id';
import { listAllColdEmailOfferings } from './list-all';
import { createColdEmailOffering } from './create';
import { updateColdEmailOffering } from './update';
import { deleteColdEmailOffering } from './delete';
import { getColdEmailOfferingByIdForUser } from './get-by-id-for-user';
import { postGenerateFromNotesHandler } from './routes/post-generate-from-notes-handler';

/**
 * `/api/data/cold-email-offerings` — CRUD + AI generate for cold outreach angles.
 */
export const createColdEmailOfferingsRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const includeArchived = req.query.include_archived === 'true';
      const rows = await listAllColdEmailOfferings(req.supabase, { includeArchived });
      res.status(200).json({ success: true, data: rows, count: rows.length });
    } catch (error) {
      console.error('❌ GET /cold-email-offerings', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/generate-from-notes', postGenerateFromNotesHandler);

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      let userId = req.body?.user_id as string | undefined;
      if (!userId?.trim()) {
        userId = await getDefaultTenantUserId(req.supabase);
      }

      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const hook = typeof req.body?.hook === 'string' ? req.body.hook.trim() : '';
      const description =
        typeof req.body?.description === 'string' ? req.body.description.trim() : '';
      const sourceNotes =
        typeof req.body?.source_notes === 'string' ? req.body.source_notes.trim() : '';
      const sortOrder =
        typeof req.body?.sort_order === 'number' ? req.body.sort_order : 0;
      const isArchived = req.body?.is_archived === true;

      if (!title || !hook) {
        res.status(400).json({ success: false, error: 'title and hook are required' });
        return;
      }

      const row = await createColdEmailOffering(req.supabase, {
        userId: userId.trim(),
        title,
        hook,
        description,
        sourceNotes,
        sortOrder,
        isArchived,
      });
      res.status(201).json({ success: true, data: row });
    } catch (error) {
      console.error('❌ POST /cold-email-offerings', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid id' });
        return;
      }

      let userId = req.body?.user_id as string | undefined;
      if (!userId?.trim()) {
        userId = await getDefaultTenantUserId(req.supabase);
      }

      const patch: {
        title?: string;
        hook?: string;
        description?: string;
        sourceNotes?: string;
        sortOrder?: number;
        isArchived?: boolean;
      } = {};

      if (typeof req.body?.title === 'string') patch.title = req.body.title.trim();
      if (typeof req.body?.hook === 'string') patch.hook = req.body.hook.trim();
      if (typeof req.body?.description === 'string') {
        patch.description = req.body.description.trim();
      }
      if (typeof req.body?.source_notes === 'string') {
        patch.sourceNotes = req.body.source_notes.trim();
      }
      if (typeof req.body?.sort_order === 'number') patch.sortOrder = req.body.sort_order;
      if (typeof req.body?.is_archived === 'boolean') patch.isArchived = req.body.is_archived;

      const row = await updateColdEmailOffering(req.supabase, id, userId.trim(), patch);
      res.status(200).json({ success: true, data: row });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ PATCH /cold-email-offerings/:id', error);
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid id' });
        return;
      }

      let userId = req.query.user_id as string | undefined;
      if (!userId?.trim()) {
        userId = await getDefaultTenantUserId(req.supabase);
      }

      await deleteColdEmailOffering(req.supabase, id, userId.trim());
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      console.error('❌ DELETE /cold-email-offerings/:id', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid id' });
        return;
      }

      let userId = req.query.user_id as string | undefined;
      if (!userId?.trim()) {
        userId = await getDefaultTenantUserId(req.supabase);
      }

      const row = await getColdEmailOfferingByIdForUser(req.supabase, id, userId.trim());
      if (!row) {
        res.status(404).json({ success: false, error: 'Offering not found' });
        return;
      }

      res.status(200).json({ success: true, data: row });
    } catch (error) {
      console.error('❌ GET /cold-email-offerings/:id', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
};
