import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Count rows currently in `processing` (global single-flight).
 */
export const countCommercialLeadResearchProcessing = async (
  supabase: SupabaseClient
): Promise<number> => {
  const { count, error } = await supabase
    .from('commercial_lead_research_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  if (error) {
    throw new Error(`Failed to count processing queue rows: ${error.message}`);
  }

  return count ?? 0;
};
