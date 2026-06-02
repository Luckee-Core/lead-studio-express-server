import { Router } from 'express';
import {
  runLeadGoogleSearch,
  runLeadGoogleSearchFacebook,
  runLeadGoogleSearchInstagram,
  runLeadGoogleSearchLinkedin,
} from '../lead-google-search';
import { runLeadWebsiteResearch } from '../lead-website-research';
import { runLeadDescriptionFromStoredWebsiteCrawl } from '../lead-description-from-stored-crawl';
import { runLeadFacebookPageResearch } from '../lead-facebook-page-research';
import { runLeadFacebookPostsResearch } from '../lead-facebook-posts-research';
import { runLeadAutoCategorize } from '../lead-auto-categorize';
import { runLeadAutoCategorizeBatch } from '../lead-auto-categorize-batch';
import { runLeadSameDomainUrlDiscovery } from '../lead-same-domain-url-discovery';
import { runLeadPlaywrightWebsiteUrlDiscovery } from '../lead-playwright-website-url-discovery';
import { runLeadDictationNotesResearch } from '../lead-dictation-notes-research';
import { runLeadOpportunityDictationAnalysis } from '../lead-opportunity-dictation-analysis';
import { runLeadOpportunityDictationApply } from '../lead-opportunity-dictation-apply';
import { getLeadOpportunitySuggestions } from '../lead-opportunity-suggestions-list';
import { postLeadOpportunitySuggestionsDecide } from '../lead-opportunity-suggestions-decide';
import { runLeadResearchPipeline } from '../lead-research-pipeline';
import { runLeadLovableDesignPrompt } from './lead-lovable-design-prompt';

/**
 * Lead research workers (Supabase Edge Function → POST). Base path /api/services.
 */
export const createServicesHttpRouter = (): Router => {
  const router = Router();
  router.post('/lead-research-pipeline', runLeadResearchPipeline);
  router.post('/lead-lovable-design-prompt', runLeadLovableDesignPrompt);
  router.post('/lead-google-search', runLeadGoogleSearch);
  router.post('/lead-google-search/facebook', runLeadGoogleSearchFacebook);
  router.post('/lead-google-search/instagram', runLeadGoogleSearchInstagram);
  router.post('/lead-google-search/linkedin', runLeadGoogleSearchLinkedin);
  router.post('/lead-same-domain-url-discovery', runLeadSameDomainUrlDiscovery);
  router.post('/lead-playwright-website-url-discovery', runLeadPlaywrightWebsiteUrlDiscovery);
  router.post('/lead-website-research', runLeadWebsiteResearch);
  router.post('/lead-description-from-stored-crawl', runLeadDescriptionFromStoredWebsiteCrawl);
  router.post('/lead-facebook-page-research', runLeadFacebookPageResearch);
  router.post('/lead-facebook-posts-research', runLeadFacebookPostsResearch);
  router.post('/lead-auto-categorize', runLeadAutoCategorize);
  router.post('/lead-auto-categorize-batch', runLeadAutoCategorizeBatch);
  router.post('/lead-dictation-notes-research', runLeadDictationNotesResearch);
  router.post('/lead-opportunity-dictation-analysis', runLeadOpportunityDictationAnalysis);
  router.post('/lead-opportunity-dictation-apply', runLeadOpportunityDictationApply);
  router.get('/lead-opportunity-suggestions', getLeadOpportunitySuggestions);
  router.post('/lead-opportunity-suggestions/decide', postLeadOpportunitySuggestionsDecide);
  return router;
};
