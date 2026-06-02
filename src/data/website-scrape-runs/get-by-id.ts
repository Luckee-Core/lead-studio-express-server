/**
 * Fetch a single website scrape run by id.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { WebsiteScrapeRun } from './get-all';

export const getWebsiteScrapeRunById = async (
  supabase: SupabaseClient,
  id: string
): Promise<WebsiteScrapeRun | null> => {
  const { data, error } = await supabase
    .from('website_scrape_runs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch website scrape run: ${error.message}`);
  }

  return data;
};
