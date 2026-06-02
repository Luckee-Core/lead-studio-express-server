import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Persist a batch auto-categorize request row (payload snapshot).
 */
export const insertLeadAutoCategorizeBatchRequest = async (
  supabase: SupabaseClient,
  params: {
    id: string;
    userId: string;
    payload: unknown;
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_auto_categorize_batch_requests').insert({
    id: params.id,
    user_id: params.userId,
    payload: params.payload,
    status: 'pending',
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadAutoCategorizeBatchRequest:', error);
    throw new Error(error.message);
  }
};
