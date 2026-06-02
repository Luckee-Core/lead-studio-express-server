import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Deduct credits from user balance
 * 
 * STEPS:
 * 1. Fetch current balance
 * 2. Calculate new balance
 * 3. Update user_credits
 * 4. Insert credit_deductions record
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param creditsUsed - Credits to deduct
 * @param exchangeId - Exchange ID for audit trail
 * @param exchangeType - Type of exchange ('classification', 'conversational', etc.)
 * @returns New balance after deduction
 * @throws Error if fetch or update fails
 * 
 * @example
 * const newBalance = await deductCredits(
 *   supabase, 
 *   'user-123', 
 *   50, 
 *   'exchange-456', 
 *   'strategic'
 * );
 * console.log(`New balance: ${newBalance}`);
 */
export const deductCredits = async (
  supabase: SupabaseClient,
  userId: string,
  creditsUsed: number,
  exchangeId: string,
  exchangeType: string
): Promise<number> => {
  
  console.log(`💰 Deducting ${creditsUsed} credits for ${exchangeType}...`);
  
  // Fetch current balance
  const { data: creditsData, error: fetchError } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single();
  
  if (fetchError) {
    throw new Error(`Failed to fetch user credits: ${fetchError.message}`);
  }
  
  const currentCredits = creditsData?.credits || 0;
  const newBalance = currentCredits - creditsUsed;
  
  // Update balance
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      credits: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    throw new Error(`Failed to update credits: ${updateError.message}`);
  }
  
  // Record deduction
  await supabase.from('credit_deductions').insert({
    id: uuidv4(),
    user_id: userId,
    exchange_id: exchangeId,
    exchange_type: exchangeType,
    credits_deducted: creditsUsed,
    created_at: new Date().toISOString(),
  });
  
  console.log(`✅ Credits deducted. New balance: ${newBalance}`);
  
  return newBalance;
};

