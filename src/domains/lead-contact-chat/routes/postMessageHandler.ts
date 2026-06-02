import { Request, Response } from 'express';
import { routeParam } from '../../../utils/express/route-param';
import { getDefaultTenantUserId } from '../../../data/users';
import { createSupabaseClient } from '../../../services/supabase/create-supabase-client';
import { createAnthropicClient } from '../../../services/ai/anthropic-client';
import { processLeadContactChat } from '../processLeadContactChat';
import { getMessagesHandler } from './getMessagesHandler';

/**
 * POST /api/lead-contact-chat/:leadContactId/messages
 * Body: { content, userId? } — `userId` optional; server uses default tenant user when omitted.
 */
export const postMessageHandler = async (req: Request, res: Response) => {
  try {
    const leadContactId = routeParam(req.params.leadContactId);
    const { userId: rawUserId, content } = req.body;
    if (!leadContactId || !content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const supabase = createSupabaseClient(req);
    const userId =
      typeof rawUserId === 'string' && rawUserId.trim()
        ? rawUserId.trim()
        : await getDefaultTenantUserId(supabase);
    let anthropic = null;
    try {
      anthropic = createAnthropicClient(req);
    } catch {
      console.warn('⚠️ Anthropic client unavailable for lead contact chat');
    }

    await processLeadContactChat(
      supabase,
      anthropic,
      userId,
      leadContactId,
      content.trim(),
    );

    req.query.userId = userId;
    return getMessagesHandler(req, res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ postMessageHandler:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
