/**
 * GET /api/email/open — 1×1 open-tracking pixel (or optional redirect).
 */

import { Request, Response } from 'express';
import { getSupabaseClient } from '../../../db/supabase-client';
import { findLeadSentEmailByOpenTrackingToken } from '../../../data/lead-sent-emails/find-by-open-tracking-token';
import { recordLeadSentEmailOpen } from '../record-lead-sent-email-open';

/** Smallest valid transparent GIF (1×1). */
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Handle open-tracking pixel request. Query: `t` = open_tracking_token.
 */
export const openTrackingHandler = async (req: Request, res: Response): Promise<void> => {
  const tokenParam = req.query.t;
  const token = typeof tokenParam === 'string' ? tokenParam.trim() : '';

  if (!token) {
    res.status(400).send('Missing token');
    return;
  }

  console.log(`📥 Open tracking pixel hit (token ${token.slice(0, 8)}…)`);

  try {
    const supabase = getSupabaseClient();
    const record = await findLeadSentEmailByOpenTrackingToken(supabase, token);

    if (record) {
      const result = await recordLeadSentEmailOpen(supabase, record);
      console.log(
        `📤 Open tracking recorded: sent_email=${record.id} first_open=${result.isFirstOpen} count=${result.openedCount}`
      );
    } else {
      console.log(`⚠️ Open tracking: no lead_sent_emails row for token ${token.slice(0, 8)}…`);
    }
  } catch (error) {
    console.error('❌ Open tracking handler error:', error);
  }

  const redirectUrl = process.env.EMAIL_OPEN_TRACKING_REDIRECT_URL?.trim();
  if (redirectUrl) {
    res.redirect(302, redirectUrl);
    return;
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.status(200).send(TRANSPARENT_GIF);
};
