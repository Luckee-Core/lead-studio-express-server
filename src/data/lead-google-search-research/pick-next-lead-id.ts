import { SupabaseClient } from '@supabase/supabase-js';

export const pickNextLeadIdForGoogleSearchResearch = async (
  supabase: SupabaseClient
): Promise<string | null> => {
  const { data, error } = await supabase.rpc('next_lead_id_for_google_search_research');
  if (error) throw new Error(`pickNextLead Google search: ${error.message}`);
  return data as string | null;
};
