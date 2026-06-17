import { SupabaseClient } from '@supabase/supabase-js';
import type { ColdEmailOfferingRow } from './types';

/**
 * List all cold email offerings (single-tenant OSS).
 */
export const listAllColdEmailOfferings = async (
  supabase: SupabaseClient,
  options?: { includeArchived?: boolean },
): Promise<ColdEmailOfferingRow[]> => {
  let query = supabase
    .from('cold_email_offering')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ listAllColdEmailOfferings:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as ColdEmailOfferingRow[];
};
