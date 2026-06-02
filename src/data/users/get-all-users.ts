import { SupabaseClient } from '@supabase/supabase-js';
import type { User } from './get-user-by-id';

/**
 * Get all users
 * @param supabaseClient - Authenticated Supabase client
 * @returns Array of users
 */
export const getAllUsers = async (
  supabaseClient: SupabaseClient
): Promise<User[]> => {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data ?? [];
};
