import { SupabaseClient } from '@supabase/supabase-js';

export type LeadOpportunityDictationResponseRow = {
  id: string;
  structured: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const getLeadOpportunityDictationResponseById = async (
  supabase: SupabaseClient,
  responseId: string
): Promise<LeadOpportunityDictationResponseRow | null> => {
  const { data, error } = await supabase
    .from('lead_opportunity_dictation_responses')
    .select('*')
    .eq('id', responseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('❌ getLeadOpportunityDictationResponseById:', error);
    throw new Error(error.message);
  }

  return data as LeadOpportunityDictationResponseRow;
};
