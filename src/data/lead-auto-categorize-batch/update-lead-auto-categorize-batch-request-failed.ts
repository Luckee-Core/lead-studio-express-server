import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mark a batch auto-categorize request failed when no response/exchange was stored.
 */
export const updateLeadAutoCategorizeBatchRequestFailed = async (
  supabase: SupabaseClient,
  requestId: string
): Promise<void> => {
  const { error } = await supabase
    .from('lead_auto_categorize_batch_requests')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('❌ updateLeadAutoCategorizeBatchRequestFailed:', error);
    throw new Error(error.message);
  }
};
