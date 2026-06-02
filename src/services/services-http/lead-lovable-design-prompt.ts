import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadLovableContextById } from '../../data/leads/get-lead-lovable-context-by-id';
import { getManagedAnthropicClient } from '../ai';
import { verifyCronSecret } from '../lead-research-shared';
import { processLeadLovableDesignPrompt } from './process-lead-lovable-design-prompt';

type PostBody = {
  leadId?: string;
  userId?: string;
  notes?: string;
};

/**
 * POST /api/services/lead-lovable-design-prompt
 * Body: { leadId, userId, notes } — generates a paste-ready Lovable prompt (luckee-web BFF proxy).
 */
export const runLeadLovableDesignPrompt = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const body = req.body as PostBody;
  const leadId = body.leadId?.trim();
  const notes = body.notes?.trim();

  if (!leadId || !notes) {
    res.status(400).json({ success: false, error: 'leadId and notes are required' });
    return;
  }

  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    res.status(503).json({ success: false, error: 'AI service unavailable' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const leadContext = await getLeadLovableContextById(supabase, leadId);

    const result = await processLeadLovableDesignPrompt(anthropic, { notes, leadContext });

    if (!result.success) {
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    res.status(200).json({ success: true, prompt: result.prompt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('❌ [runLeadLovableDesignPrompt]', message);
    res.status(500).json({ success: false, error: message });
  }
};
