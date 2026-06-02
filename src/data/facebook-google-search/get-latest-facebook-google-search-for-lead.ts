import { SupabaseClient } from '@supabase/supabase-js';

export type LatestFacebookGoogleSearchRow = {
  id: string;
  payload: Record<string, unknown> | null;
  status: string;
};

/**
 * Returns the most recent `facebook_google_search` row for a lead (any status, any source), if any.
 */
export const getLatestFacebookGoogleSearchForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LatestFacebookGoogleSearchRow | null> => {
  const { data, error } = await supabase
    .from('facebook_google_search')
    .select('id, payload, status')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`getLatestFacebookGoogleSearchForLead: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id as string,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    status: String(row.status ?? ''),
  };
};
