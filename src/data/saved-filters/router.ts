import { Router, Request, Response } from 'express';
import { getDefaultTenantUserId } from '../users';
import { createSavedFilter } from './create-saved-filter';
import { deleteSavedFilter } from './delete-saved-filter';
import { listAllSavedFilters } from './list-all-saved-filters';
import { listSavedFiltersByUserId } from './list-saved-filters-by-user-id';
import { updateSavedFilter } from './update-saved-filter';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * `/api/data/saved-filters` — CRUD for leads filter presets (GET all for single-tenant; per-user routes still supported).
 */
export const createSavedFiltersRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const rows = await listAllSavedFilters(req.supabase);
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length,
      });
    } catch (error) {
      console.error('❌ GET /saved-filters', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || Array.isArray(userId)) {
        res.status(400).json({ success: false, error: 'Invalid user id' });
        return;
      }

      const rows = await listSavedFiltersByUserId(req.supabase, userId);
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length,
      });
    } catch (error) {
      console.error('❌ GET /saved-filters/user/:userId', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      let userId = req.body?.user_id as string | undefined;
      const rawName = req.body?.name as string | undefined;
      const rawFilters = req.body?.filters;

      if (typeof rawName !== 'string') {
        res.status(400).json({
          success: false,
          error: 'name is required',
        });
        return;
      }

      if (!userId?.trim()) {
        userId = await getDefaultTenantUserId(req.supabase);
      }
      if (!isRecord(rawFilters)) {
        res.status(400).json({ success: false, error: 'filters object is required' });
        return;
      }

      const row = await createSavedFilter(req.supabase, {
        userId: userId.trim(),
        name: rawName,
        filters: rawFilters,
      });
      res.status(201).json({ success: true, data: row });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ POST /saved-filters', error);
      res.status(500).json({
        success: false,
        error: msg,
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const rawUserId = req.body?.user_id as string | undefined;
      const userId = rawUserId?.trim() ? rawUserId.trim() : undefined;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid id' });
        return;
      }

      const patch: { name?: string; filters?: Record<string, unknown> } = {};
      if (typeof req.body?.name === 'string') {
        patch.name = req.body.name;
      }
      if (req.body?.filters !== undefined) {
        if (!isRecord(req.body.filters)) {
          res.status(400).json({ success: false, error: 'filters must be an object' });
          return;
        }
        patch.filters = req.body.filters;
      }

      const row = await updateSavedFilter(req.supabase, id, userId, patch);
      res.status(200).json({ success: true, data: row });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const notFound = msg.includes('not found');
      console.error('❌ PATCH /saved-filters/:id', error);
      res.status(notFound ? 404 : 400).json({ success: false, error: msg });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.query.user_id as string | undefined;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid id' });
        return;
      }

      await deleteSavedFilter(req.supabase, id, userId);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const notFound = msg.includes('not found');
      console.error('❌ DELETE /saved-filters/:id', error);
      res.status(notFound ? 404 : 500).json({
        success: false,
        error: msg,
      });
    }
  });

  return router;
};
