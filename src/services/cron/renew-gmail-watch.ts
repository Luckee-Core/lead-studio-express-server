/**
 * Renew Gmail push watch (must be called at least every 7 days).
 * POST /api/cron/renew-gmail-watch
 */

import { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getGmailClient, startGmailWatch } from '../../services/email/gmail';
import { upsertGmailWatchState } from '../../data/gmail-watch-state';

export const renewGmailWatchHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const sendAsEmail = process.env.GMAIL_SEND_AS_EMAIL;
    if (!sendAsEmail) {
      res.status(500).json({ success: false, error: 'GMAIL_SEND_AS_EMAIL not set' });
      return;
    }

    const gmail = await getGmailClient();
    const { historyId, expiration } = await startGmailWatch(gmail);

    const supabase = getSupabaseClient();
    await upsertGmailWatchState(supabase, sendAsEmail, historyId);

    console.log(`Gmail watch renewed; expiration ${expiration}`);

    res.json({
      success: true,
      historyId,
      expiration: Number(expiration),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('renew-gmail-watch error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
