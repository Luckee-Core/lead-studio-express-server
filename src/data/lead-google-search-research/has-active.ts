import { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'lead_google_search_research';

export const hasActiveLeadGoogleSearchResearch = async (
  supabase: SupabaseClient
): Promise<boolean> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`hasActive ${TABLE}: ${error.message}`);
  return !!data;
};
