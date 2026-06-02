import { SupabaseClient } from '@supabase/supabase-js';

export const updateLeadOpportunityDictationRequestCompletion = async (
  supabase: SupabaseClient,
  requestId: string,
  params: {
    exchangeId: string;
    responseId: string;
    status: 'completed' | 'failed';
  }
): Promise<void> => {
  const { error } = await supabase
    .from('lead_opportunity_dictation_requests')
    .update({
      exchange_id: params.exchangeId,
      response_id: params.responseId,
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('❌ updateLeadOpportunityDictationRequestCompletion:', error);
    throw new Error(error.message);
  }
};
