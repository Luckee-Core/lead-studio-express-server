import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Oldest `users.id` for single-tenant Lead Studio (one logical tenant, one users row typical).
 */
export const getDefaultTenantUserId = async (supabase: SupabaseClient): Promise<string> => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error('No users in database; seed a user before using Lead Studio.');
  }
  return data.id;
};
