/**
 * Workspace AI exchange costs — GET /api/data/ai-exchange-costs
 */

import { Router, Request, Response } from 'express';
import { getAiExchangeCostRowsForWorkspace } from './get-ai-exchange-cost-rows-for-workspace';

const DEFAULT_LOOKBACK_DAYS = 365;
const MAX_LOOKBACK_DAYS = 365 * 5;

const parseDaysQuery = (raw: unknown): number => {
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_LOOKBACK_DAYS;
  }
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = typeof s === 'string' ? Number.parseInt(s, 10) : Number(s);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_LOOKBACK_DAYS;
  }
  return Math.min(Math.floor(n), MAX_LOOKBACK_DAYS);
};

export const createAiExchangeCostsRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data/ai-exchange-costs?days=365
   * All AI usage rows (contact chat, website AI, Google profile SERP, Facebook posts score, email drafts)
   * for every lead visible to the tenant, since now minus `days`.
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseDaysQuery(req.query.days);
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const supabase = req.supabase;
      const data = await getAiExchangeCostRowsForWorkspace(supabase, since);

      res.status(200).json({
        success: true,
        data,
        count: data.length,
        message: 'Workspace AI exchange costs retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/ai-exchange-costs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch workspace AI exchange costs',
      });
    }
  });

  return router;
};
