import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Deletes a saved filter row by id (optionally scoped to user for safety).
 */
export const deleteSavedFilter = async (
  supabase: SupabaseClient,
  id: string,
  userId?: string
): Promise<void> => {
  let q = supabase.from('saved_filters').delete().eq('id', id);
  if (userId) {
    q = q.eq('user_id', userId);
  }

  const { data, error } = await q.select('id');

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.length) {
    throw new Error('Saved filter not found');
  }
};
