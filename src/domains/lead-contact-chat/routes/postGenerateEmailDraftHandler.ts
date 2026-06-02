import { Request, Response } from 'express';
import { routeParam } from '../../../utils/express/route-param';
import { createSupabaseClient } from '../../../services/supabase/create-supabase-client';
import { createAnthropicClient } from '../../../services/ai/anthropic-client';
import { processGenerateLeadContactIntroEmailDraft } from '../processGenerateLeadContactIntroEmailDraft';

/**
 * POST /api/lead-contact-chat/:leadContactId/generate-email-draft
 * Intro / first-touch draft only. For follow-ups use generate-follow-up-email-draft.
 * Body: { userId, emailPersona?: Record<string, string> }
 */
export const postGenerateEmailDraftHandler = async (req: Request, res: Response) => {
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
      console.warn('⚠️ Anthropic client unavailable for lead contact email draft');
    }

    const result = await processGenerateLeadContactIntroEmailDraft(
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
    console.error('❌ postGenerateEmailDraftHandler:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
