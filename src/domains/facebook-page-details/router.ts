import { Router, type Request, type Response } from 'express';
import { runFacebookPageDetailsScraper } from './run';

/**
 * POST /run — body: { profileUrl }. Runs Apify Facebook Pages Scraper (APIFY_API_TOKEN).
 */
export const createFacebookPageDetailsScraperRouter = (): Router => {
  const router = Router();

  router.post('/run', async (req: Request, res: Response): Promise<void> => {
    console.log('📥 [scrapers/facebook-page-details] POST /run');
    const body = req.body as { profileUrl?: string };
    const profileUrl = typeof body?.profileUrl === 'string' ? body.profileUrl.trim() : '';

    if (!profileUrl) {
      res.status(400).json({ success: false, error: 'profileUrl is required' });
      return;
    }

    try {
      const result = await runFacebookPageDetailsScraper({ profileUrl });
      if (!result.success) {
        res.status(500).json({ success: false, error: result.error, data: result.data });
        return;
      }
      res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      console.error('❌ [scrapers/facebook-page-details] run failed', err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      });
    }
  });

  return router;
};
