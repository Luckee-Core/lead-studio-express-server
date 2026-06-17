import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Marks a suggestion as accepted and links the catalog row created from apply.
 */
export const updateLeadOpportunitySuggestionAfterOfferingCreated = async (
  supabase: SupabaseClient,
  params: {
    dictationRequestId: string;
    sourceSuggestionId: string;
    coldEmailOfferingId: string;
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lead_opportunity_suggestions')
    .update({
      decision: 'accepted',
      created_cold_email_offering_id: params.coldEmailOfferingId,
      updated_at: now,
    })
    .eq('dictation_request_id', params.dictationRequestId)
    .eq('source_suggestion_id', params.sourceSuggestionId);

  if (error) {
    console.error('❌ updateLeadOpportunitySuggestionAfterOfferingCreated:', error);
    throw new Error(error.message);
  }
};
