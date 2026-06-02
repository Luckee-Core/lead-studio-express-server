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
 * Lists all saved filter presets (single-tenant), newest first.
 */
export const listAllSavedFilters = async (
  supabase: SupabaseClient
): Promise<SavedFilterRow[]> => {
  const { data, error } = await supabase
    .from('saved_filters')
    .select('id, user_id, name, filters, created_at, updated_at')
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
