import { SupabaseClient } from '@supabase/supabase-js';

const LEAD_ID_CHUNK_SIZE = 200;

let hasLoggedWebsiteScrapeRunsTableUnavailable = false;

const isWebsiteScrapeRunsTableUnavailable = (message: string): boolean =>
  message.includes('website_scrape_runs') &&
  (message.includes('schema cache') ||
    message.includes('Could not find the table') ||
    /relation ["']?public\.website_scrape_runs["']? does not exist/i.test(message));

/**
 * Sets `website_research_attempted` on each lead: true when any `website_scrape_runs` row exists
 * (crawl / website research pipeline was triggered at least once for that lead).
 */
export const attachWebsiteResearchAttemptedToLeads = async <T extends { id: string }>(
  supabase: SupabaseClient,
  leads: T[]
): Promise<Array<T & { website_research_attempted: boolean }>> => {
  if (leads.length === 0) return [];

  const uniqueIds = [...new Set(leads.map((l) => l.id))];
  const attemptedIds = new Set<string>();

  for (let i = 0; i < uniqueIds.length; i += LEAD_ID_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + LEAD_ID_CHUNK_SIZE);
    const { data, error } = await supabase
      .from('website_scrape_runs')
      .select('lead_id')
      .in('lead_id', chunk);

    if (error) {
      if (isWebsiteScrapeRunsTableUnavailable(error.message)) {
        if (!hasLoggedWebsiteScrapeRunsTableUnavailable) {
          hasLoggedWebsiteScrapeRunsTableUnavailable = true;
          console.warn(
            '⚠️ website_scrape_runs: table missing or not in schema cache; ' +
              'treating website_research_attempted as false for all leads.'
          );
        }
        return leads.map((l) => ({
          ...l,
          website_research_attempted: false,
        }));
      }
      throw new Error(`attachWebsiteResearchAttemptedToLeads: ${error.message}`);
    }

    for (const row of data ?? []) {
      const lid = row.lead_id as string | undefined;
      if (lid) attemptedIds.add(lid);
    }
  }

  return leads.map((l) => ({
    ...l,
    website_research_attempted: attemptedIds.has(l.id),
  }));
};
