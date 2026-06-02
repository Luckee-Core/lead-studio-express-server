import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Deletes a to_call_log row by id.
 */
export const deleteToCallLog = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase.from('to_call_log').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete to_call_log: ${error.message}`);
  }
};
