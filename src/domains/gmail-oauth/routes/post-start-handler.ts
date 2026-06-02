import { Request, Response } from 'express';
import { getSupabaseUserFromRequest } from '../../../utils/auth';
import { processStartGmailOauth } from '../process/process-start-gmail-oauth';

/**
 * POST /api/gmail-oauth/start — returns Google OAuth URL (authenticated).
 */
export const postStartHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSupabaseUserFromRequest(req);
    if (!user?.id) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const returnPath =
      typeof req.body?.returnPath === 'string' ? req.body.returnPath : undefined;

    const { authUrl } = processStartGmailOauth({
      userId: user.id,
      returnPath,
    });

    res.status(200).json({
      success: true,
      data: { authUrl },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ postStartHandler:', msg);
    res.status(500).json({ success: false, error: msg });
  }
};
