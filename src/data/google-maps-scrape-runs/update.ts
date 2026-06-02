/**
 * Update a google_maps_scrape_runs row.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { GoogleMapsScrapeRunRow } from './get-all';

export type UpdateGoogleMapsScrapeRunInput = {
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  results_count?: number;
  businesses_imported?: number;
  completed_at?: string | null;
  error?: string | null;
  duration?: number | null;
};

export const updateGoogleMapsScrapeRun = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateGoogleMapsScrapeRunInput
): Promise<GoogleMapsScrapeRunRow> => {
  const { data, error } = await supabase
    .from('google_maps_scrape_runs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update google maps scrape run: ${error.message}`);
  }

  return data;
};
