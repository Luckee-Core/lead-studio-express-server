/**
 * Find Lead Category by Normalized Name
 * Finds a lead category by its normalized_name (case-insensitive)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadCategory } from './get-all';

export const findLeadCategoryByNormalizedName = async (
  supabase: SupabaseClient,
  normalizedName: string
): Promise<LeadCategory | null> => {
  const normalized = normalizedName.toLowerCase().trim();

  const { data, error } = await supabase
    .from('lead_categories')
    .select('*')
    .eq('normalized_name', normalized)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to find lead category: ${error.message}`);
  }

  return data;
};
