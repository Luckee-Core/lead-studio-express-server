import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedFilterRow } from './types';

const MAX_NAME_LEN = 200;

export type UpdateSavedFilterInput = {
  name?: string;
  filters?: Record<string, unknown>;
};

/**
 * Updates name and/or filters for a row owned by the user.
 */
export const updateSavedFilter = async (
  supabase: SupabaseClient,
  id: string,
  userId: string | undefined,
  patch: UpdateSavedFilterInput
): Promise<SavedFilterRow> => {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name || name.length > MAX_NAME_LEN) {
      throw new Error('Invalid name');
    }
    updates.name = name;
  }

  if (patch.filters !== undefined) {
    if (!patch.filters || typeof patch.filters !== 'object' || Array.isArray(patch.filters)) {
      throw new Error('filters must be a JSON object');
    }
    updates.filters = patch.filters;
  }

  if (Object.keys(updates).length === 1) {
    throw new Error('No fields to update');
  }

  let q = supabase.from('saved_filters').update(updates).eq('id', id);
  if (userId) {
    q = q.eq('user_id', userId);
  }

  const { data, error } = await q
    .select('id, user_id, name, filters, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Saved filter not found');
  }

  return data as SavedFilterRow;
};
