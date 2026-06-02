import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunRow } from '../../types/lead-research';
import { isFacebookGoogleSearchRequestSourceColumnMissingError } from './is-request-source-column-missing-error';

export type FacebookGoogleSearchRequestSource = 'leads_table' | 'lead_detail';

let hasLoggedCreateActiveRequestSourceFallback = false;

/**
 * Inserts an active row for a Facebook Google SERP research run.
 *
 * Before migration 126, omits `request_source` so inserts still succeed.
 */
export const createActiveFacebookGoogleSearch = async (
  supabase: SupabaseClient,
  leadId: string,
  requestSource: FacebookGoogleSearchRequestSource
): Promise<LeadResearchRunRow> => {
  const now = new Date().toISOString();
  const withSource = {
    lead_id: leadId,
    status: 'active' as const,
    started_at: now,
    request_source: requestSource,
  };
  const withoutSource = {
    lead_id: leadId,
    status: 'active' as const,
    started_at: now,
  };

  let { data, error } = await supabase.from('facebook_google_search').insert(withSource).select().single();

  if (error && isFacebookGoogleSearchRequestSourceColumnMissingError(error.message)) {
    if (!hasLoggedCreateActiveRequestSourceFallback) {
      hasLoggedCreateActiveRequestSourceFallback = true;
      console.warn(
        '⚠️ facebook_google_search.request_source missing (run migration 126). ' +
          'Creating runs without request_source until the column exists.'
      );
    }
    ({ data, error } = await supabase.from('facebook_google_search').insert(withoutSource).select().single());
  }

  if (error) throw new Error(`createActive facebook_google_search: ${error.message}`);
  return data as LeadResearchRunRow;
};
