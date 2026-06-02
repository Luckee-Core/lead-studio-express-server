import { Request, Response } from 'express';
import { getSupabaseUserFromRequest } from '../../../utils/auth';
import { processGetGmailOauthStatus } from '../process/process-get-gmail-oauth-status';

type SupabaseRequest = Request & { supabase: any };

/**
 * GET /api/gmail-oauth/status
 */
export const getStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSupabaseUserFromRequest(req);
    if (!user?.id) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const supabase = (req as SupabaseRequest).supabase;
    const status = await processGetGmailOauthStatus(supabase, user.id);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ getStatusHandler:', msg);
    res.status(500).json({ success: false, error: msg });
  }
};
