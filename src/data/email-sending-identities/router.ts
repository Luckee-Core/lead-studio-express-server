/**
 * Email sending identities — list for From picker (no secrets).
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { listEmailSendingIdentitiesForUi } from './list-email-sending-identities-for-ui';

export const createEmailSendingIdentitiesRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      const rows = await listEmailSendingIdentitiesForUi(supabase);
      res.status(200).json({ success: true, data: rows, count: rows.length });
    } catch (error) {
      console.error('Error in GET /api/data/email-sending-identities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
};
