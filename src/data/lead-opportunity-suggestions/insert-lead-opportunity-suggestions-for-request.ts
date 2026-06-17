import { SupabaseClient } from '@supabase/supabase-js';

export type LeadOpportunitySuggestionInsertRow = {
  id: string;
  userId: string;
  leadId: string;
  dictationRequestId: string;
  exchangeId: string | null;
  sourceSuggestionId: string;
  title: string;
  description: string;
  reason: string;
  matchType: 'existing' | 'new';
  linkedColdEmailOfferingIds: string[];
};

/**
 * Inserts per-lead opportunity rows after a successful dictation analysis run.
 */
export const insertLeadOpportunitySuggestionsForRequest = async (
  supabase: SupabaseClient,
  rows: LeadOpportunitySuggestionInsertRow[]
): Promise<void> => {
  if (rows.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const payload = rows.map((row) => ({
    id: row.id,
    user_id: row.userId,
    lead_id: row.leadId,
    dictation_request_id: row.dictationRequestId,
    exchange_id: row.exchangeId,
    source_suggestion_id: row.sourceSuggestionId,
    title: row.title,
    description: row.description,
    reason: row.reason,
    match_type: row.matchType,
    linked_cold_email_offering_ids: row.linkedColdEmailOfferingIds,
    decision: 'pending',
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase.from('lead_opportunity_suggestions').insert(payload);

  if (error) {
    console.error('❌ insertLeadOpportunitySuggestionsForRequest:', error);
    throw new Error(error.message);
  }
};
