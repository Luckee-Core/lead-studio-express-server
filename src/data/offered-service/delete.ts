import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Delete an offered service (caller must verify ownership).
 */
export const deleteOfferedService = async (
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('offered_service')
    .delete()
    .eq('id', serviceId)
    .eq('user_id', userId);

  if (error) {
    console.error('❌ deleteOfferedService:', error);
    throw new Error(error.message);
  }
};
