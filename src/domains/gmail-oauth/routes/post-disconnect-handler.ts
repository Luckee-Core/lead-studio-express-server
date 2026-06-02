import { Request, Response } from 'express';
import { getSupabaseUserFromRequest } from '../../../utils/auth';
import { processDisconnectGmailOauth } from '../process/process-disconnect-gmail-oauth';

type SupabaseRequest = Request & { supabase: any };

/**
 * POST /api/gmail-oauth/disconnect
 */
export const postDisconnectHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSupabaseUserFromRequest(req);
    if (!user?.id) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const supabase = (req as SupabaseRequest).supabase;
    await processDisconnectGmailOauth(supabase, user.id);

    res.status(200).json({ success: true, message: 'Gmail disconnected' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ postDisconnectHandler:', msg);
    res.status(500).json({ success: false, error: msg });
  }
};
