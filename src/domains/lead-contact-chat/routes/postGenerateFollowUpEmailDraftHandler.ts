import { Request, Response } from 'express';
import { routeParam } from '../../../utils/express/route-param';
import { createSupabaseClient } from '../../../services/supabase/create-supabase-client';
import { createAnthropicClient } from '../../../services/ai/anthropic-client';
import { processGenerateLeadContactFollowUpEmailDraft } from '../processGenerateLeadContactFollowUpEmailDraft';

/**
 * POST /api/lead-contact-chat/:leadContactId/generate-follow-up-email-draft
 * Follow-up draft only; requires at least one send for this contact.
 * Body: { userId, emailPersona?: Record<string, string> }
 */
export const postGenerateFollowUpEmailDraftHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const leadContactId = routeParam(req.params.leadContactId);
    const { userId, emailPersona } = req.body;
    if (!leadContactId || !userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'leadContactId and userId are required',
      });
    }

    const personaRaw =
      emailPersona && typeof emailPersona === 'object' && !Array.isArray(emailPersona)
        ? (emailPersona as Record<string, unknown>)
        : {};
    const persona: Record<string, string> = {};
    for (const [key, value] of Object.entries(personaRaw)) {
      persona[key] = typeof value === 'string' ? value : '';
    }

    const supabase = createSupabaseClient(req);
    let anthropic = null;
    try {
      anthropic = createAnthropicClient(req);
    } catch {
      console.warn('⚠️ Anthropic client unavailable for lead contact follow-up email draft');
    }

    const result = await processGenerateLeadContactFollowUpEmailDraft(
      supabase,
      anthropic,
      userId,
      leadContactId,
      persona,
    );

    return res.json({
      success: true,
      subject: result.subject,
      body: result.body,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('NO_PRIOR_SENDS:')) {
      return res.status(400).json({
        success: false,
        error: message.replace(/^NO_PRIOR_SENDS:\s*/, ''),
      });
    }
    console.error('❌ postGenerateFollowUpEmailDraftHandler:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
