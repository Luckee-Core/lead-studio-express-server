import { SupabaseClient } from '@supabase/supabase-js';

export const deleteLeadCategory = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error: detachError } = await supabase
    .from('leads')
    .update({ category_id: null, category_name: null })
    .eq('category_id', id);

  if (detachError) {
    throw new Error(`Failed to detach leads from category: ${detachError.message}`);
  }

  const { error } = await supabase.from('lead_categories').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lead category: ${error.message}`);
  }
};
