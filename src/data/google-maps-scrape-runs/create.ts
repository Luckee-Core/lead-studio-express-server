/**
 * Insert a google_maps_scrape_runs row.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { GoogleMapsScrapeRunRow } from './get-all';

export type CreateGoogleMapsScrapeRunInput = {
  name: string;
  search_query: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  results_count?: number;
  businesses_imported?: number;
  max_results?: number | null;
};

export const createGoogleMapsScrapeRun = async (
  supabase: SupabaseClient,
  input: CreateGoogleMapsScrapeRunInput
): Promise<GoogleMapsScrapeRunRow> => {
  const { data, error } = await supabase
    .from('google_maps_scrape_runs')
    .insert({
      name: input.name,
      search_query: input.search_query,
      status: input.status ?? 'in_progress',
      results_count: input.results_count ?? 0,
      businesses_imported: input.businesses_imported ?? 0,
      max_results: input.max_results ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create google maps scrape run: ${error.message}`);
  }

  return data;
};
