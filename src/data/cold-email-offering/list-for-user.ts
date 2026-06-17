import { SupabaseClient } from '@supabase/supabase-js';
import type { ColdEmailOfferingRow } from './types';

/**
 * List cold email offerings for a user, ordered for display.
 */
export const listColdEmailOfferingsForUser = async (
  supabase: SupabaseClient,
  userId: string,
  options?: { includeArchived?: boolean },
): Promise<ColdEmailOfferingRow[]> => {
  let query = supabase
    .from('cold_email_offering')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ listColdEmailOfferingsForUser:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as ColdEmailOfferingRow[];
};
