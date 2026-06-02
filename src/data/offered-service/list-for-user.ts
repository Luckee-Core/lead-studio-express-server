import { SupabaseClient } from '@supabase/supabase-js';
import type { OfferedServiceRow } from './types';

/**
 * List offered services for a user, ordered for display.
 */
export const listOfferedServicesForUser = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<OfferedServiceRow[]> => {
  const { data, error } = await supabase
    .from('offered_service')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ listOfferedServicesForUser:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as OfferedServiceRow[];
};
