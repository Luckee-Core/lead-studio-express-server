import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { listLeadOpportunitySuggestionsForLead } from '../../data/lead-opportunity-suggestions';
import { verifyCronSecret } from '../lead-research-shared';

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
};

/**
 * GET /api/services/lead-opportunity-suggestions?leadId=&userId=
 * Returns persisted per-lead opportunity rows (all dictation runs).
 */
export const getLeadOpportunitySuggestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const leadId = typeof req.query.leadId === 'string' ? req.query.leadId.trim() : '';
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

  if (!leadId || !userId) {
    res.status(400).json({ success: false, error: 'leadId and userId are required' });
    return;
  }

  const supabase = getSupabaseClient();

  try {
    const rows = await listLeadOpportunitySuggestionsForLead(supabase, { userId, leadId });
    const suggestions = rows.map((row) => ({
      id: row.id,
      sourceSuggestionId: row.source_suggestion_id,
      dictationRequestId: row.dictation_request_id,
      exchangeId: row.exchange_id,
      title: row.title,
      description: row.description,
      reason: row.reason,
      matchType: row.match_type,
      linkedOfferedServiceIds: asStringArray(row.linked_offered_service_ids),
      decision: row.decision,
      createdOfferedServiceId: row.created_offered_service_id,
      createdAt: row.created_at,
    }));

    res.status(200).json({ success: true, suggestions });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ getLeadOpportunitySuggestions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
