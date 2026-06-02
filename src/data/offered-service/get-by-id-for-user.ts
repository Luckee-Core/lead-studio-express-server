import { SupabaseClient } from '@supabase/supabase-js';
import type { OfferedServiceRow } from './types';

/**
 * Fetch one offered service if it belongs to the user.
 */
export const getOfferedServiceByIdForUser = async (
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<OfferedServiceRow | null> => {
  const { data, error } = await supabase
    .from('offered_service')
    .select('*')
    .eq('id', serviceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ getOfferedServiceByIdForUser:', error);
    throw new Error(error.message);
  }

  return data as OfferedServiceRow | null;
};
