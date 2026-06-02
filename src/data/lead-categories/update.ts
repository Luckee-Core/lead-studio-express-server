import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadCategory } from './get-all';

export type UpdateLeadCategoryInput = {
  name?: string;
  normalized_name?: string;
};

export const updateLeadCategory = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateLeadCategoryInput
): Promise<LeadCategory> => {
  const { data, error } = await supabase
    .from('lead_categories')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update lead category: ${error.message}`);
  }

  return data;
};
