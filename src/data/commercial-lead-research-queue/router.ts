/**
 * Commercial lead research queue — enqueue (one row per lead) + process-next (cron / Edge).
 * POST /enqueue, POST /process-next
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { verifyCronSecret } from '../../services/lead-research-shared';
import {
  enqueueCommercialLeadResearchBatch,
  identifyLeadsForResearchQueue,
  processNextCommercialLeadResearchStep,
} from '../../services/commercial-lead-research-queue';
import { getAllCommercialLeadResearchQueue } from './get-all';

const parseLeadIds = (req: Request): string[] | null => {
  const body = req.body;
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { leadIds?: unknown }).leadIds;
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
};

export const createCommercialLeadResearchQueueRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    if (!verifyCronSecret(req)) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const rawLimit = req.query.limit;
    const limit =
      typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : Number(rawLimit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 200;

    const supabase = getSupabaseClient();

    try {
      const items = await getAllCommercialLeadResearchQueue(supabase, safeLimit);
      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('❌ GET commercial-lead-research-queue:', e);
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.post('/enqueue', async (req: Request, res: Response): Promise<void> => {
    if (!verifyCronSecret(req)) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const leadIds = parseLeadIds(req);
    if (!leadIds || leadIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'leadIds_required',
        message: 'Provide leadIds: string[]',
      });
      return;
    }

    const supabase = getSupabaseClient();

    try {
      const { batchId, insertedCount } = await enqueueCommercialLeadResearchBatch(
        supabase,
        leadIds
      );

      res.status(200).json({
        success: true,
        batchId,
        insertedCount,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'leadIds_required') {
        res.status(400).json({ success: false, error: 'leadIds_required' });
        return;
      }
      console.error('❌ POST commercial-lead-research-queue/enqueue:', e);
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.post('/process-next', async (req: Request, res: Response): Promise<void> => {
    if (!verifyCronSecret(req)) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const supabase = getSupabaseClient();

    try {
      const result = await processNextCommercialLeadResearchStep(supabase);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('❌ POST commercial-lead-research-queue/process-next:', e);
      res.status(500).json({ success: false, error: msg });
    }
  });

  /**
   * Cron / Edge: identify up to 10 leads (website, no succeeded Facebook Google search,
   * not already queued/processing) and enqueue queue rows only — does not run research.
   */
  router.post('/identify-leads-for-research-queue', async (req: Request, res: Response): Promise<void> => {
    if (!verifyCronSecret(req)) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const supabase = getSupabaseClient();

    try {
      const result = await identifyLeadsForResearchQueue(supabase);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('❌ POST commercial-lead-research-queue/identify-leads-for-research-queue:', e);
      res.status(500).json({ success: false, error: msg });
    }
  });

  return router;
};
