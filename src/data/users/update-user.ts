import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './get-user-by-id';

/**
 * Parameters for updating a user
 */
export interface UpdateUserParams {
  user_id: string;
  email?: string;
  name?: string;
  image?: string | null;
}

/**
 * Update user fields
 * @param supabaseClient - Authenticated Supabase client
 * @param params - User update parameters
 * @returns Updated user
 */
export const updateUser = async (
  supabaseClient: SupabaseClient,
  params: UpdateUserParams
): Promise<User> => {
  const updateData: Partial<User> = {
    updated_at: new Date().toISOString(),
  };

  if (params.email !== undefined) updateData.email = params.email;
  if (params.name !== undefined) updateData.name = params.name;
  if (params.image !== undefined) updateData.image = params.image;

  const { data, error } = await supabaseClient
    .from('users')
    .update(updateData)
    .eq('id', params.user_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
};

