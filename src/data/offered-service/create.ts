import { SupabaseClient } from '@supabase/supabase-js';
import type { OfferedServiceRow } from './types';

export type CreateOfferedServiceInput = {
  id: string;
  userId: string;
  title: string;
  description: string;
  sortOrder: number;
};

/**
 * Insert a new offered service row.
 */
export const createOfferedService = async (
  supabase: SupabaseClient,
  input: CreateOfferedServiceInput,
): Promise<OfferedServiceRow> => {
  const { data, error } = await supabase
    .from('offered_service')
    .insert({
      id: input.id,
      user_id: input.userId,
      title: input.title,
      description: input.description,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();

  if (error) {
    console.error('❌ createOfferedService:', error);
    throw new Error(error.message);
  }

  return data as OfferedServiceRow;
};
