/**
 * HTTP routes under /api/data/website-scrape-runs
 */

import { Router, Request, Response } from 'express';
import { getAllWebsiteScrapeRuns } from './get-all';
import { getWebsiteScrapeRunById } from './get-by-id';
import { getWebsiteScrapeRunsByLeadId } from './get-by-lead-id';
import { createWebsiteScrapeRun } from './create';
import { updateWebsiteScrapeRun } from './update';
import { processWebsiteScrapeTrigger } from './processWebsiteScrapeTrigger';

export const createWebsiteScrapeRunsRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const runs = await getAllWebsiteScrapeRuns(req.supabase);

      res.status(200).json({
        success: true,
        data: runs,
        count: runs.length,
        message: 'Website scrape runs retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/website-scrape-runs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch website scrape runs',
      });
    }
  });

  router.get('/lead/:leadId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadId } = req.params;

      if (!leadId || Array.isArray(leadId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lead ID',
          message: 'Lead ID must be a single string',
        });
        return;
      }

      const runs = await getWebsiteScrapeRunsByLeadId(req.supabase, leadId);

      res.status(200).json({
        success: true,
        data: runs,
        count: runs.length,
        message: 'Website scrape runs retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/website-scrape-runs/lead/:leadId:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch website scrape runs',
      });
    }
  });

  router.post('/trigger', async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadId, website, additionalUrls } = req.body;

      if (!leadId || !website) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'leadId and website are required',
        });
        return;
      }

      const extra =
        Array.isArray(additionalUrls) && additionalUrls.length > 0
          ? additionalUrls.map((u: unknown) => String(u).trim()).filter(Boolean)
          : undefined;

      console.log('🚀 Trigger website scrape:', { leadId, website, extraCount: extra?.length ?? 0 });

      const { finalRun, scrapeRunId } = await processWebsiteScrapeTrigger(req.supabase, {
        leadId,
        website: String(website),
        ...(extra ? { additionalUrls: extra } : {}),
      });

      res.status(201).json({
        success: true,
        data: finalRun,
        scrapeRunId,
        message: 'Website scrape triggered successfully',
      });
    } catch (error) {
      console.error('❌ POST /api/data/website-scrape-runs/trigger:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to trigger website scrape',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;

      if (!input?.lead_id || !input?.website) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'lead_id and website are required',
        });
        return;
      }

      const run = await createWebsiteScrapeRun(req.supabase, {
        lead_id: input.lead_id,
        website: String(input.website),
        status: input.status,
        scraped_data: input.scraped_data,
        cost_cents: input.cost_cents,
        error: input.error,
      });

      res.status(201).json({
        success: true,
        data: run,
        message: 'Website scrape run created successfully',
      });
    } catch (error) {
      console.error('❌ POST /api/data/website-scrape-runs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create website scrape run',
      });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid scrape run ID',
          message: 'Scrape run ID must be a single string',
        });
        return;
      }

      const run = await getWebsiteScrapeRunById(req.supabase, id);

      if (!run) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Website scrape run with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: run,
        message: 'Website scrape run retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/website-scrape-runs/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch website scrape run',
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid scrape run ID',
          message: 'Scrape run ID must be a single string',
        });
        return;
      }

      const run = await updateWebsiteScrapeRun(req.supabase, id, input);

      res.status(200).json({
        success: true,
        data: run,
        message: 'Website scrape run updated successfully',
      });
    } catch (error) {
      console.error('❌ PATCH /api/data/website-scrape-runs/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update website scrape run',
      });
    }
  });

  return router;
};
