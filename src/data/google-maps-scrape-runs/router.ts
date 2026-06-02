/**
 * HTTP routes under /api/data/google-maps-scrape-runs
 */

import { Router, Request, Response } from 'express';
import { getAllGoogleMapsScrapeRuns } from './get-all';
import { getGoogleMapsScrapeRunById } from './get-by-id';
import { createGoogleMapsScrapeRun } from './create';
import { updateGoogleMapsScrapeRun } from './update';
import { processGoogleMapsScrapeTrigger } from './processGoogleMapsScrapeTrigger';

export const createGoogleMapsScrapeRunsRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const runs = await getAllGoogleMapsScrapeRuns(req.supabase);

      res.status(200).json({
        success: true,
        data: runs,
        count: runs.length,
        message: 'Google Maps scrape runs retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/google-maps-scrape-runs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch google maps scrape runs',
      });
    }
  });

  router.post('/trigger', async (req: Request, res: Response): Promise<void> => {
    try {
      const scrapeRunId = req.body?.scrape_run_id as string | undefined;

      if (!scrapeRunId || typeof scrapeRunId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'scrape_run_id is required',
        });
        return;
      }

      console.log('🚀 Trigger Google Maps scrape:', scrapeRunId);

      const result = await processGoogleMapsScrapeTrigger(req.supabase, scrapeRunId);

      const {
        scrapeRun,
        businessesScraped,
        leadsCreated,
        leadsSkippedDuplicateName,
        nameDuplicates,
        durationMs,
      } = result;

      if (scrapeRun.status === 'failed') {
        res.status(422).json({
          success: false,
          error: scrapeRun.error || 'Scrape failed',
          scrapeRun,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          scrapeRun,
          businessesScraped,
          leadsCreated,
          leadsSkippedDuplicateName,
          nameDuplicates,
          durationMs,
        },
        message: 'Google Maps scrape completed',
      });
    } catch (error) {
      console.error('❌ POST /api/data/google-maps-scrape-runs/trigger:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;

      if (!input?.name || !input?.search_query) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'name and search_query are required',
        });
        return;
      }

      const run = await createGoogleMapsScrapeRun(req.supabase, {
        name: String(input.name),
        search_query: String(input.search_query),
        status: input.status,
        results_count: input.results_count,
        businesses_imported: input.businesses_imported,
        max_results: input.max_results ?? null,
      });

      res.status(201).json({
        success: true,
        data: run,
        message: 'Google Maps scrape run created successfully',
      });
    } catch (error) {
      console.error('❌ POST /api/data/google-maps-scrape-runs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create google maps scrape run',
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
        });
        return;
      }

      const run = await getGoogleMapsScrapeRunById(req.supabase, id);

      if (!run) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Google Maps scrape run with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: run,
        message: 'Google Maps scrape run retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/google-maps-scrape-runs/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
        });
        return;
      }

      const patch: Parameters<typeof updateGoogleMapsScrapeRun>[2] = {};
      if (input.status !== undefined) patch.status = input.status;
      if (input.results_count !== undefined) patch.results_count = input.results_count;
      if (input.businesses_imported !== undefined)
        patch.businesses_imported = input.businesses_imported;
      if (input.completed_at !== undefined) patch.completed_at = input.completed_at;
      if (input.error !== undefined) patch.error = input.error;
      if (input.duration !== undefined) patch.duration = input.duration;

      const run = await updateGoogleMapsScrapeRun(req.supabase, id, patch);

      res.status(200).json({
        success: true,
        data: run,
        message: 'Google Maps scrape run updated successfully',
      });
    } catch (error) {
      console.error('❌ PATCH /api/data/google-maps-scrape-runs/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
