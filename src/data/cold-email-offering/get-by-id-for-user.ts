import { SupabaseClient } from '@supabase/supabase-js';
import type { ColdEmailOfferingRow } from './types';

/**
 * Fetch one cold email offering by id for a user.
 */
export const getColdEmailOfferingByIdForUser = async (
  supabase: SupabaseClient,
  offeringId: string,
  userId: string,
): Promise<ColdEmailOfferingRow | null> => {
  const { data, error } = await supabase
    .from('cold_email_offering')
    .select('*')
    .eq('id', offeringId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ getColdEmailOfferingByIdForUser:', error);
    throw new Error(error.message);
  }

  return data as ColdEmailOfferingRow | null;
};
