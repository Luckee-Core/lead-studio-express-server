import { SupabaseClient } from '@supabase/supabase-js';
import type { ColdEmailOfferingRow } from './types';

export type CreateColdEmailOfferingInput = {
  id?: string;
  userId: string;
  title: string;
  hook: string;
  description: string;
  sourceNotes?: string;
  sortOrder?: number;
  isArchived?: boolean;
};

/**
 * Insert a new cold email offering row.
 */
export const createColdEmailOffering = async (
  supabase: SupabaseClient,
  input: CreateColdEmailOfferingInput,
): Promise<ColdEmailOfferingRow> => {
  const row: Record<string, unknown> = {
    user_id: input.userId,
    title: input.title,
    hook: input.hook,
    description: input.description,
    source_notes: input.sourceNotes ?? '',
    sort_order: input.sortOrder ?? 0,
    is_archived: input.isArchived ?? false,
  };

  if (input.id) {
    row.id = input.id;
  }

  const { data, error } = await supabase
    .from('cold_email_offering')
    .insert(row)
    .select('*')
    .single();

  if (error) {
    console.error('❌ createColdEmailOffering:', error);
    throw new Error(error.message);
  }

  return data as ColdEmailOfferingRow;
};
