import { SupabaseClient } from '@supabase/supabase-js';

/**
 * UserCredits interface
 */
export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get user credits for a specific user
 * @param supabaseClient - Authenticated Supabase client
 * @param userId - User ID
 * @returns User credits record
 */
export const getUserCreditsByUser = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<UserCredits | null> => {
  const { data, error } = await supabaseClient
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user credits: ${error.message}`);
  }

  return data;
};

