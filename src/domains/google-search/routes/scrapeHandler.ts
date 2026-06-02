import { Request, Response } from 'express';
import { processGoogleSerpScrape } from '../processGoogleSerpScrape';

/**
 * POST /api/google-search/scrape
 * Body: { businessName, city, state }
 */
const HANDLER_LOG = '[google-search:api]';

export const scrapeHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startedAt = Date.now();

  try {
    const { businessName, city, state } = req.body as {
      businessName?: string;
      city?: string;
      state?: string;
    };

    console.log(`${HANDLER_LOG} ${requestId} POST /api/google-search/scrape`, {
      hasBody: Boolean(req.body),
      contentType: req.headers['content-type'],
    });

    if (!businessName?.trim() || !city?.trim() || !state?.trim()) {
      console.warn(`${HANDLER_LOG} ${requestId} validation failed`, {
        businessName: Boolean(businessName?.trim()),
        city: Boolean(city?.trim()),
        state: Boolean(state?.trim()),
      });
      res.status(400).json({
        success: false,
        error: 'businessName, city, and state are required',
      });
      return;
    }

    const payload = {
      businessName: businessName.trim(),
      city: city.trim(),
      state: state.trim(),
    };
    console.log(`${HANDLER_LOG} ${requestId} scrape start`, payload);

    const results = await processGoogleSerpScrape(payload);

    const durationMs = Date.now() - startedAt;
    console.log(
      `${HANDLER_LOG} ${requestId} scrape ok resultCount=${results.length} durationMs=${durationMs}`
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`${HANDLER_LOG} ${requestId} error after ${Date.now() - startedAt}ms`, err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
