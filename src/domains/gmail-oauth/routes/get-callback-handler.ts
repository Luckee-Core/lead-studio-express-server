import { Request, Response } from 'express';
import { processGmailOauthCallback } from '../process/process-gmail-oauth-callback';

/**
 * GET /api/gmail-oauth/callback — Google redirect; browser 302 to frontend.
 */
export const getCallbackHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    const error = typeof req.query.error === 'string' ? req.query.error : undefined;

    const result = await processGmailOauthCallback({ code, state, error });
    res.redirect(302, result.redirectUrl);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('❌ getCallbackHandler:', msg);
    res.status(500).send('OAuth callback failed');
  }
};
