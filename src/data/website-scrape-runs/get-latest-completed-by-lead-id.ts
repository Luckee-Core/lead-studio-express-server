import { SupabaseClient } from '@supabase/supabase-js';
import type { WebsiteScrapeRun } from './get-all';

/**
 * Most recent completed website scrape for a lead (for replaying AI without Apify).
 */
export const getLatestCompletedWebsiteScrapeRunForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<WebsiteScrapeRun | null> => {
  const { data, error } = await supabase
    .from('website_scrape_runs')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`getLatestCompletedWebsiteScrapeRunForLead: ${error.message}`);
  }

  return (data as WebsiteScrapeRun | null) ?? null;
};
