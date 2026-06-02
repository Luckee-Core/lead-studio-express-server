import { SupabaseClient } from '@supabase/supabase-js';

export type LeadOpportunityDictationRequestRow = {
  id: string;
  user_id: string;
  lead_id: string;
  content: string;
  exchange_id: string | null;
  response_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export const getLeadOpportunityDictationRequestById = async (
  supabase: SupabaseClient,
  requestId: string
): Promise<LeadOpportunityDictationRequestRow | null> => {
  const { data, error } = await supabase
    .from('lead_opportunity_dictation_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('❌ getLeadOpportunityDictationRequestById:', error);
    throw new Error(error.message);
  }

  return data as LeadOpportunityDictationRequestRow;
};
