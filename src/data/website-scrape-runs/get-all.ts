/**
 * Fetch all website scrape runs (newest first).
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type WebsiteScrapeRun = {
  id: string;
  lead_id: string;
  website: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'timeout';
  scraped_data: Record<string, unknown> | null;
  cost_cents: number | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  created_at: string;
};

export const getAllWebsiteScrapeRuns = async (
  supabase: SupabaseClient
): Promise<WebsiteScrapeRun[]> => {
  const { data, error } = await supabase
    .from('website_scrape_runs')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch website scrape runs: ${error.message}`);
  }

  return data || [];
};
