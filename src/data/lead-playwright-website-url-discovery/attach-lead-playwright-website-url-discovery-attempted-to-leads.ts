import { SupabaseClient } from '@supabase/supabase-js';

const LEAD_ID_CHUNK_SIZE = 200;

let hasLoggedPlaywrightTableUnavailable = false;

/**
 * True when PostgREST/Supabase reports the discovery table is absent or not yet in the schema cache
 * (migration not applied, or cache refresh pending after CREATE TABLE).
 */
const isPlaywrightDiscoveryTableUnavailable = (message: string): boolean =>
  message.includes('lead_playwright_website_url_discovery') &&
  (message.includes('schema cache') ||
    message.includes('Could not find the table') ||
    /relation ["']?public\.lead_playwright_website_url_discovery["']? does not exist/i.test(
      message
    ));

/**
 * Sets `playwright_website_url_discovery_attempted` on each lead: true when any
 * `lead_playwright_website_url_discovery` row exists for that lead (one automated attempt per lead).
 */
export const attachLeadPlaywrightWebsiteUrlDiscoveryAttemptedToLeads = async <T extends { id: string }>(
  supabase: SupabaseClient,
  leads: T[]
): Promise<Array<T & { playwright_website_url_discovery_attempted: boolean }>> => {
  if (leads.length === 0) return [];

  const uniqueIds = [...new Set(leads.map((l) => l.id))];
  const attemptedIds = new Set<string>();

  for (let i = 0; i < uniqueIds.length; i += LEAD_ID_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + LEAD_ID_CHUNK_SIZE);
    const { data, error } = await supabase
      .from('lead_playwright_website_url_discovery')
      .select('lead_id')
      .in('lead_id', chunk);

    if (error) {
      if (isPlaywrightDiscoveryTableUnavailable(error.message)) {
        if (!hasLoggedPlaywrightTableUnavailable) {
          hasLoggedPlaywrightTableUnavailable = true;
          console.warn(
            '⚠️ lead_playwright_website_url_discovery: table missing or not in schema cache; ' +
              'apply migrations/125_create_lead_playwright_website_url_discovery.sql (or reload Supabase schema). ' +
              'Treating playwright_website_url_discovery_attempted as false for all leads.'
          );
        }
        return leads.map((l) => ({
          ...l,
          playwright_website_url_discovery_attempted: false,
        }));
      }
      throw new Error(`attachLeadPlaywrightWebsiteUrlDiscoveryAttemptedToLeads: ${error.message}`);
    }

    for (const row of data ?? []) {
      const lid = row.lead_id as string | undefined;
      if (lid) attemptedIds.add(lid);
    }
  }

  return leads.map((l) => ({
    ...l,
    playwright_website_url_discovery_attempted: attemptedIds.has(l.id),
  }));
};
