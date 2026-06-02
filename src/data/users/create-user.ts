import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './get-user-by-id';

/**
 * Parameters for creating a new user
 */
export interface CreateUserParams {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'apple' | 'email';
  image?: string | null;
}

/**
 * Create a new user
 * @param supabaseClient - Authenticated Supabase client
 * @param params - User creation parameters
 * @returns Created user
 */
export const createUser = async (
  supabaseClient: SupabaseClient,
  params: CreateUserParams
): Promise<User> => {
  const now = new Date().toISOString();

  const { data, error } = await supabaseClient
    .from('users')
    .insert({
      id: params.id,
      email: params.email,
      name: params.name,
      provider: params.provider,
      image: params.image || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
};

