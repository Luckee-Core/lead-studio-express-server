/**
 * Fetch one google_maps_scrape_runs row by id.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { GoogleMapsScrapeRunRow } from './get-all';

export const getGoogleMapsScrapeRunById = async (
  supabase: SupabaseClient,
  id: string
): Promise<GoogleMapsScrapeRunRow | null> => {
  const { data, error } = await supabase
    .from('google_maps_scrape_runs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load google maps scrape run: ${error.message}`);
  }

  return data;
};
