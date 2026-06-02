import { Request, Response } from 'express';
import { processPlacesTextSearch } from '../processPlacesTextSearch';

/**
 * POST /api/google-search/places-text-search
 * Body: { businessName, city, state }
 * Uses GOOGLE_MAPS_API_KEY (Places API New Text Search).
 */
const HANDLER_LOG = '[google-search:api]';

export const placesTextSearchHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startedAt = Date.now();

  try {
    const { businessName, city, state } = req.body as {
      businessName?: string;
      city?: string;
      state?: string;
    };

    console.log(`${HANDLER_LOG} ${requestId} POST /api/google-search/places-text-search`);

    if (!businessName?.trim() || !city?.trim() || !state?.trim()) {
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

    const { places, rawError } = await processPlacesTextSearch(payload);

    if (rawError) {
      const isConfig = rawError.includes('GOOGLE_MAPS_API_KEY');
      console.warn(`${HANDLER_LOG} ${requestId} places failed: ${rawError}`);
      res.status(isConfig ? 503 : 502).json({
        success: false,
        error: rawError,
        places: [],
      });
      return;
    }

    console.log(
      `${HANDLER_LOG} ${requestId} places ok count=${places.length} durationMs=${Date.now() - startedAt}`
    );

    res.json({
      success: true,
      places,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`${HANDLER_LOG} ${requestId} error`, err);
    res.status(500).json({
      success: false,
      error: err.message,
      places: [],
    });
  }
};
