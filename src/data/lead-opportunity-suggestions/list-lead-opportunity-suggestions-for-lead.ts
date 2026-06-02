import { SupabaseClient } from '@supabase/supabase-js';

export type LeadOpportunitySuggestionRow = {
  id: string;
  user_id: string;
  lead_id: string;
  dictation_request_id: string;
  exchange_id: string | null;
  source_suggestion_id: string;
  title: string;
  description: string;
  reason: string;
  match_type: 'existing' | 'new';
  linked_offered_service_ids: unknown;
  decision: 'pending' | 'accepted' | 'dismissed';
  created_offered_service_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Lists all stored lead opportunity suggestions for a lead (newest dictation batches first).
 */
export const listLeadOpportunitySuggestionsForLead = async (
  supabase: SupabaseClient,
  params: { userId: string; leadId: string }
): Promise<LeadOpportunitySuggestionRow[]> => {
  const { data, error } = await supabase
    .from('lead_opportunity_suggestions')
    .select('*')
    .eq('user_id', params.userId)
    .eq('lead_id', params.leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ listLeadOpportunitySuggestionsForLead:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as LeadOpportunitySuggestionRow[];
};
