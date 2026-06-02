import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { updateLeadOpportunitySuggestionDecision } from '../../data/lead-opportunity-suggestions';
import { verifyCronSecret } from '../lead-research-shared';

type DecisionItem = {
  dictationRequestId?: string;
  sourceSuggestionId?: string;
  decision?: string;
};

/**
 * POST /api/services/lead-opportunity-suggestions/decide
 * Body: { leadId, userId, items: [{ dictationRequestId, sourceSuggestionId, decision: 'accepted' | 'dismissed' }] }
 */
export const postLeadOpportunitySuggestionsDecide = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const body = req.body as {
    leadId?: string;
    userId?: string;
    items?: DecisionItem[];
  };

  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!leadId || !userId || items.length === 0) {
    res.status(400).json({
      success: false,
      error: 'leadId, userId, and items are required',
    });
    return;
  }

  const supabase = getSupabaseClient();

  try {
    for (const raw of items) {
      const dictationRequestId =
        typeof raw.dictationRequestId === 'string' ? raw.dictationRequestId.trim() : '';
      const sourceSuggestionId =
        typeof raw.sourceSuggestionId === 'string' ? raw.sourceSuggestionId.trim() : '';
      const decision =
        raw.decision === 'accepted' || raw.decision === 'dismissed' ? raw.decision : null;

      if (!dictationRequestId || !sourceSuggestionId || !decision) {
        res.status(400).json({
          success: false,
          error: 'Each item needs dictationRequestId, sourceSuggestionId, and decision',
        });
        return;
      }

      await updateLeadOpportunitySuggestionDecision(supabase, {
        userId,
        leadId,
        dictationRequestId,
        sourceSuggestionId,
        decision,
      });
    }

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ postLeadOpportunitySuggestionsDecide:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
