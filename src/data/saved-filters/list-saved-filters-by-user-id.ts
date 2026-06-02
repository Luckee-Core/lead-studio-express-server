import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedFilterRow } from './types';

const isMissingSavedFiltersTableError = (error: {
  code?: string;
  message?: string;
}): boolean => {
  if (error.code === 'PGRST205') return true;
  const msg = error.message ?? '';
  return msg.includes('schema cache') || msg.includes('Could not find the table');
};

/**
 * Lists saved filter presets for a user, newest first.
 */
export const listSavedFiltersByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<SavedFilterRow[]> => {
  const { data, error } = await supabase
    .from('saved_filters')
    .select('id, user_id, name, filters, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingSavedFiltersTableError(error)) {
      console.warn(
        '⚠️ saved_filters table unavailable; returning []. Apply migration 132_create_saved_filters.sql if this is unexpected.'
      );
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as SavedFilterRow[];
};
