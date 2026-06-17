import { SupabaseClient } from '@supabase/supabase-js';
import type { ColdEmailOfferingRow } from './types';

export type UpdateColdEmailOfferingInput = {
  title?: string;
  hook?: string;
  description?: string;
  sourceNotes?: string;
  sortOrder?: number;
  isArchived?: boolean;
};

/**
 * Update a cold email offering row (caller must verify ownership).
 */
export const updateColdEmailOffering = async (
  supabase: SupabaseClient,
  offeringId: string,
  userId: string,
  patch: UpdateColdEmailOfferingInput,
): Promise<ColdEmailOfferingRow> => {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.hook !== undefined) row.hook = patch.hook;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.sourceNotes !== undefined) row.source_notes = patch.sourceNotes;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isArchived !== undefined) row.is_archived = patch.isArchived;

  const { data, error } = await supabase
    .from('cold_email_offering')
    .update(row)
    .eq('id', offeringId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ updateColdEmailOffering:', error);
    throw new Error(error.message);
  }

  return data as ColdEmailOfferingRow;
};
