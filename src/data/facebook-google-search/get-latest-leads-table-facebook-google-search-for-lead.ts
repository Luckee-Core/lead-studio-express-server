import { SupabaseClient } from '@supabase/supabase-js';
import { getLatestFacebookGoogleSearchForLead } from './get-latest-facebook-google-search-for-lead';
import { isFacebookGoogleSearchRequestSourceColumnMissingError } from './is-request-source-column-missing-error';

export type LatestLeadsTableFacebookGoogleSearchRow = {
  id: string;
  payload: Record<string, unknown> | null;
  status: string;
};

/**
 * Latest `facebook_google_search` row for a lead that originated from the leads **list row** (one-shot UI).
 * Used to block a second list-row run without affecting lead-detail retries.
 *
 * Before migration 126, falls back to latest row for the lead (any source), matching legacy one-shot behavior.
 */
export const getLatestLeadsTableFacebookGoogleSearchForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LatestLeadsTableFacebookGoogleSearchRow | null> => {
  const { data, error } = await supabase
    .from('facebook_google_search')
    .select('id, payload, status')
    .eq('lead_id', leadId)
    .eq('request_source', 'leads_table')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    if (isFacebookGoogleSearchRequestSourceColumnMissingError(error.message)) {
      return getLatestFacebookGoogleSearchForLead(supabase, leadId);
    }
    throw new Error(`getLatestLeadsTableFacebookGoogleSearchForLead: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id as string,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    status: String(row.status ?? ''),
  };
};
