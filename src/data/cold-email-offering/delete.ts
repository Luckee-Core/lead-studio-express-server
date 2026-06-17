import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Delete a cold email offering (caller must verify ownership).
 */
export const deleteColdEmailOffering = async (
  supabase: SupabaseClient,
  offeringId: string,
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('cold_email_offering')
    .delete()
    .eq('id', offeringId)
    .eq('user_id', userId);

  if (error) {
    console.error('❌ deleteColdEmailOffering:', error);
    throw new Error(error.message);
  }
};
