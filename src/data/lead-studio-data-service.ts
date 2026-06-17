import { Router } from 'express';
import { createUsersRouter } from './users';
import { createUserCreditsRouter } from './user-credits';
import { createLeadCategoriesRouter } from './lead-categories';
import { createLeadContactsRouter } from './lead-contacts';
import { createLeadActivitiesRouter } from './lead-activities';
import { createLeadContactActivitiesRouter } from './lead-contact-activities';
import { createLeadSentEmailsRouter } from './lead-sent-emails';
import { createLeadContactEmailQueueRouter } from './lead-contact-email-queue';
import { createLeadContactEmailsRouter } from './lead-contact-emails/router';
import { createEmailSendingIdentitiesRouter } from './email-sending-identities/router';
import { createLeadContactEmailAttachmentsRouter } from './lead-contact-email-attachments/router';
import { createLeadCostsRouter } from './lead-costs';
import { createAiExchangeCostsRouter } from './ai-exchange-costs';
import { createLeadsRouter } from './leads/router';
import { createWebsiteScrapeRunsRouter } from './website-scrape-runs/router';
import { createGoogleMapsScrapeRunsRouter } from './google-maps-scrape-runs/router';
import { createToCallLogRouter } from './to-call-log';
import { createCommercialLeadResearchQueueRouter } from './commercial-lead-research-queue/router';
import { createSavedFiltersRouter } from './saved-filters/router';
import { createColdEmailOfferingsRouter } from './cold-email-offering';

/**
 * Lead Studio data layer — CRUD routers for OSS lead-studio-web.
 */
export const createLeadStudioDataService = (): Router => {
  const router = Router();

  router.use('/users', createUsersRouter());
  router.use('/user-credits', createUserCreditsRouter());
  router.use('/lead-categories', createLeadCategoriesRouter());
  router.use('/lead-contacts', createLeadContactsRouter());
  router.use('/lead-activities', createLeadActivitiesRouter());
  router.use('/lead-contact-activities', createLeadContactActivitiesRouter());
  router.use('/lead-sent-emails', createLeadSentEmailsRouter());
  router.use('/lead-contact-email-queue', createLeadContactEmailQueueRouter());
  router.use('/lead-contact-emails', createLeadContactEmailsRouter());
  router.use('/email-sending-identities', createEmailSendingIdentitiesRouter());
  router.use('/lead-contact-email-attachments', createLeadContactEmailAttachmentsRouter());
  router.use('/lead-costs', createLeadCostsRouter());
  router.use('/ai-exchange-costs', createAiExchangeCostsRouter());
  router.use('/leads', createLeadsRouter());
  router.use('/website-scrape-runs', createWebsiteScrapeRunsRouter());
  router.use('/google-maps-scrape-runs', createGoogleMapsScrapeRunsRouter());
  router.use('/to-call-log', createToCallLogRouter());
  router.use('/commercial-lead-research-queue', createCommercialLeadResearchQueueRouter());
  router.use('/saved-filters', createSavedFiltersRouter());
  router.use('/cold-email-offerings', createColdEmailOfferingsRouter());

  return router;
};
