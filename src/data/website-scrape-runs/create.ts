/**
 * Insert a website_scrape_runs row.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { WebsiteScrapeRun } from './get-all';

export type CreateWebsiteScrapeRunInput = {
  lead_id: string;
  website: string;
  status?: 'pending' | 'active' | 'completed' | 'failed' | 'timeout';
  scraped_data?: Record<string, unknown> | null;
  cost_cents?: number | null;
  error?: string | null;
};

export const createWebsiteScrapeRun = async (
  supabase: SupabaseClient,
  input: CreateWebsiteScrapeRunInput
): Promise<WebsiteScrapeRun> => {
  const { data, error } = await supabase
    .from('website_scrape_runs')
    .insert({
      ...input,
      status: input.status ?? 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create website scrape run: ${error.message}`);
  }

  return data;
};
