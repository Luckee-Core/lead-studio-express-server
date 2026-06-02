/**
 * Fetch website scrape runs for a lead (newest first).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { WebsiteScrapeRun } from './get-all';

export const getWebsiteScrapeRunsByLeadId = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<WebsiteScrapeRun[]> => {
  const { data, error } = await supabase
    .from('website_scrape_runs')
    .select('*')
    .eq('lead_id', leadId)
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch website scrape runs: ${error.message}`);
  }

  return data || [];
};
