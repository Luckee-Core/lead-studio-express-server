/**
 * Get Lead By ID
 * Retrieves a single lead by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from './get-all';

export const getLeadById = async (
  supabase: SupabaseClient,
  id: string
): Promise<Lead | null> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch lead: ${error.message}`);
  }

  return data;
};
