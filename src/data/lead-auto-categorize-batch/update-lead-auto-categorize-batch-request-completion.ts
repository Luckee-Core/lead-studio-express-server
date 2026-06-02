import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Link request to exchange/response and set final status after AI completes.
 */
export const updateLeadAutoCategorizeBatchRequestCompletion = async (
  supabase: SupabaseClient,
  requestId: string,
  params: {
    exchangeId: string;
    responseId: string;
    status: 'completed' | 'failed';
  }
): Promise<void> => {
  const { error } = await supabase
    .from('lead_auto_categorize_batch_requests')
    .update({
      exchange_id: params.exchangeId,
      response_id: params.responseId,
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('❌ updateLeadAutoCategorizeBatchRequestCompletion:', error);
    throw new Error(error.message);
  }
};
