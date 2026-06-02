import { Router } from 'express';
import * as handlers from './routes';

/**
 * Google web search (SERP) scraping for lead discovery.
 * POST /scrape — body: { businessName, city, state }
 * POST /resolve-profiles — body: { businessName, city, state, results: { title, url }[] }
 * POST /places-text-search — body: { businessName, city, state } (Places API New; GOOGLE_MAPS_API_KEY)
 */
export const createGoogleSearchRouter = (): Router => {
  const router = Router();
  router.post('/scrape', handlers.scrapeHandler);
  router.post('/resolve-profiles', handlers.resolveProfilesHandler);
  router.post('/places-text-search', handlers.placesTextSearchHandler);
  return router;
};
