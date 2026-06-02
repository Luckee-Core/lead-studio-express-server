import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedFilterRow } from './types';

const MAX_NAME_LEN = 200;

/**
 * Inserts a saved filter preset for a user.
 */
export const createSavedFilter = async (
  supabase: SupabaseClient,
  input: { userId: string; name: string; filters: Record<string, unknown> }
): Promise<SavedFilterRow> => {
  const name = input.name.trim();
  if (!name || name.length > MAX_NAME_LEN) {
    throw new Error('Invalid name');
  }
  if (!input.filters || typeof input.filters !== 'object' || Array.isArray(input.filters)) {
    throw new Error('filters must be a JSON object');
  }

  const { data, error } = await supabase
    .from('saved_filters')
    .insert({
      user_id: input.userId,
      name,
      filters: input.filters,
    })
    .select('id, user_id, name, filters, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavedFilterRow;
};
