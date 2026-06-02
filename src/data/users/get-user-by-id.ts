import { SupabaseClient } from '@supabase/supabase-js';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'apple' | 'email';
  image?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user by ID
 * @param supabaseClient - Authenticated Supabase client
 * @param userId - User ID
 * @returns User or null if not found
 */
export const getUserById = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<User | null> => {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data;
};
