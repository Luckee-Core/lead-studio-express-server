import { SupabaseClient } from '@supabase/supabase-js';

export type FacebookPageResearchRow = {
  id: string;
  payload: unknown;
  completed_at: string | null;
};

/**
 * Latest succeeded Facebook page scrape run for a lead (for UI).
 */
export const getLatestSucceededFacebookPageResearchByLeadId = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<FacebookPageResearchRow | null> => {
  const { data, error } = await supabase
    .from('lead_facebook_page_research')
    .select('id, payload, completed_at')
    .eq('lead_id', leadId)
    .eq('status', 'succeeded')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`getLatestSucceededFacebookPageResearchByLeadId: ${error.message}`);
  }

  return data as FacebookPageResearchRow | null;
};
