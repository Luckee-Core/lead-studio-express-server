import { SupabaseClient } from '@supabase/supabase-js';
import type { OfferedServiceRow } from './types';

export type UpdateOfferedServiceInput = {
  title?: string;
  description?: string;
  sortOrder?: number;
};

/**
 * Update an offered service row (caller must verify ownership).
 */
export const updateOfferedService = async (
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
  patch: UpdateOfferedServiceInput,
): Promise<OfferedServiceRow> => {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;

  const { data, error } = await supabase
    .from('offered_service')
    .update(row)
    .eq('id', serviceId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ updateOfferedService:', error);
    throw new Error(error.message);
  }

  return data as OfferedServiceRow;
};
