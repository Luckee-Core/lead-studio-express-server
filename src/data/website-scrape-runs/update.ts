/**
 * Update a website_scrape_runs row.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { WebsiteScrapeRun } from './get-all';

export type UpdateWebsiteScrapeRunInput = {
  status?: 'pending' | 'active' | 'completed' | 'failed' | 'timeout';
  scraped_data?: Record<string, unknown> | null;
  cost_cents?: number | null;
  completed_at?: string | null;
  error?: string | null;
};

export const updateWebsiteScrapeRun = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateWebsiteScrapeRunInput
): Promise<WebsiteScrapeRun> => {
  const { data, error } = await supabase
    .from('website_scrape_runs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update website scrape run: ${error.message}`);
  }

  return data;
};
