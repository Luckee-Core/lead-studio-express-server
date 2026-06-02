/**
 * Row shape + list all google_maps_scrape_runs (newest first).
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type GoogleMapsScrapeRunRow = {
  id: string;
  name: string;
  search_query: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results_count: number;
  businesses_imported: number;
  max_results: number | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  duration: number | null;
};

export const getAllGoogleMapsScrapeRuns = async (
  supabase: SupabaseClient
): Promise<GoogleMapsScrapeRunRow[]> => {
  const { data, error } = await supabase
    .from('google_maps_scrape_runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch google maps scrape runs: ${error.message}`);
  }

  return data || [];
};
