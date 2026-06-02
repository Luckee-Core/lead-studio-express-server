import { SupabaseClient } from '@supabase/supabase-js';

export const pickNextLeadIdForWebsiteResearch = async (
  supabase: SupabaseClient
): Promise<string | null> => {
  const { data, error } = await supabase.rpc('next_lead_id_for_website_research');
  if (error) throw new Error(`pickNextLead website research: ${error.message}`);
  return data as string | null;
};
