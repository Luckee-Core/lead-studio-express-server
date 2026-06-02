import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadCategory } from './get-all';

export type CreateLeadCategoryInput = {
  name: string;
  normalized_name: string;
  leads_count?: number;
};

export const createLeadCategory = async (
  supabase: SupabaseClient,
  input: CreateLeadCategoryInput
): Promise<LeadCategory> => {
  const { data, error } = await supabase
    .from('lead_categories')
    .insert({
      ...input,
      leads_count: input.leads_count ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead category: ${error.message}`);
  }

  return data;
};
