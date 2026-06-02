import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Persist structured AI output for a batch auto-categorize run.
 */
export const insertLeadAutoCategorizeBatchResponse = async (
  supabase: SupabaseClient,
  id: string,
  structured: unknown
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_auto_categorize_batch_responses').insert({
    id,
    structured,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadAutoCategorizeBatchResponse:', error);
    throw new Error(error.message);
  }
};
