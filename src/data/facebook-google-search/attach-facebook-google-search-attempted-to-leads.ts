import { SupabaseClient } from '@supabase/supabase-js';
import { isFacebookGoogleSearchRequestSourceColumnMissingError } from './is-request-source-column-missing-error';

const LEAD_ID_CHUNK_SIZE = 200;

let hasLoggedRequestSourceColumnFallback = false;

/**
 * Sets `facebook_google_search_attempted` on each lead: true when any `facebook_google_search`
 * row with `request_source = leads_table` exists (list-row one-shot; lead detail runs use `lead_detail`).
 *
 * Before migration 126, falls back to “any row for lead” so GET leads still works.
 */
export const attachFacebookGoogleSearchAttemptedToLeads = async <T extends { id: string }>(
  supabase: SupabaseClient,
  leads: T[]
): Promise<Array<T & { facebook_google_search_attempted: boolean }>> => {
  if (leads.length === 0) return [];

  const uniqueIds = [...new Set(leads.map((l) => l.id))];
  const attemptedIds = new Set<string>();
  let useLegacyAnyRow = false;

  for (let i = 0; i < uniqueIds.length; i += LEAD_ID_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + LEAD_ID_CHUNK_SIZE);
    const fetchChunk = async () => {
      if (useLegacyAnyRow) {
        return supabase.from('facebook_google_search').select('lead_id').in('lead_id', chunk);
      }
      return supabase
        .from('facebook_google_search')
        .select('lead_id')
        .eq('request_source', 'leads_table')
        .in('lead_id', chunk);
    };

    let { data, error } = await fetchChunk();

    if (
      error &&
      !useLegacyAnyRow &&
      isFacebookGoogleSearchRequestSourceColumnMissingError(error.message)
    ) {
      if (!hasLoggedRequestSourceColumnFallback) {
        hasLoggedRequestSourceColumnFallback = true;
        console.warn(
          '⚠️ facebook_google_search.request_source missing (run migration 126). ' +
            'Treating any facebook_google_search row as list-row attempted for attach.'
        );
      }
      useLegacyAnyRow = true;
      ({ data, error } = await fetchChunk());
    }

    if (error) {
      throw new Error(`attachFacebookGoogleSearchAttemptedToLeads: ${error.message}`);
    }

    for (const row of data ?? []) {
      const lid = row.lead_id as string | undefined;
      if (lid) attemptedIds.add(lid);
    }
  }

  return leads.map((l) => ({
    ...l,
    facebook_google_search_attempted: attemptedIds.has(l.id),
  }));
};
