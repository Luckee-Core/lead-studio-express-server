import { Router } from 'express';
import * as handlers from './routes';

/**
 * Lead contact chat API.
 */
export const createLeadContactChatRouter = (): Router => {
  const router = Router();

  router.post(
    '/:leadContactId/generate-email-draft',
    handlers.postGenerateEmailDraftHandler,
  );
  router.post(
    '/:leadContactId/generate-follow-up-email-draft',
    handlers.postGenerateFollowUpEmailDraftHandler,
  );
  router.get('/:leadContactId/messages', handlers.getMessagesHandler);
  router.post('/:leadContactId/messages', handlers.postMessageHandler);

  return router;
};
