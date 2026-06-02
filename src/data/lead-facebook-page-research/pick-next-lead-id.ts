import { SupabaseClient } from '@supabase/supabase-js';

export const pickNextLeadIdForFacebookPageResearch = async (
  supabase: SupabaseClient
): Promise<string | null> => {
  const { data, error } = await supabase.rpc('next_lead_id_for_facebook_page_research');
  if (error) throw new Error(`pickNextLead facebook page research: ${error.message}`);
  return data as string | null;
};
