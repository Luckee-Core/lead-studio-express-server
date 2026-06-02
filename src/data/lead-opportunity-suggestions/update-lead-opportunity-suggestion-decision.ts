import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sets approval state for a single lead opportunity suggestion row.
 */
export const updateLeadOpportunitySuggestionDecision = async (
  supabase: SupabaseClient,
  params: {
    userId: string;
    leadId: string;
    dictationRequestId: string;
    sourceSuggestionId: string;
    decision: 'accepted' | 'dismissed';
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lead_opportunity_suggestions')
    .update({
      decision: params.decision,
      updated_at: now,
    })
    .eq('user_id', params.userId)
    .eq('lead_id', params.leadId)
    .eq('dictation_request_id', params.dictationRequestId)
    .eq('source_suggestion_id', params.sourceSuggestionId);

  if (error) {
    console.error('❌ updateLeadOpportunitySuggestionDecision:', error);
    throw new Error(error.message);
  }
};
