/**
 * Get All Lead Categories
 * Retrieves all lead categories
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LeadCategory = {
  id: string;
  name: string;
  normalized_name: string;
  leads_count: number;
  created_at: string;
  updated_at: string;
};

export const getAllLeadCategories = async (
  supabase: SupabaseClient
): Promise<LeadCategory[]> => {
  const { data, error } = await supabase
    .from('lead_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch lead categories: ${error.message}`);
  }

  return data || [];
};
