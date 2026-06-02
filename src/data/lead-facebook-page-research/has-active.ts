import { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'lead_facebook_page_research';

export const hasActiveLeadFacebookPageResearch = async (
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
