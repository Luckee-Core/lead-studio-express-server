import { SupabaseClient } from '@supabase/supabase-js';

/**
 * CreditDeduction interface
 */
export interface CreditDeduction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  session_id?: string;
  exchange_id?: string;
  created_at: string;
}

/**
 * Parameters for creating a credit deduction
 */
export interface CreateCreditDeductionParams {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  session_id?: string;
  exchange_id?: string;
}

/**
 * Create a credit deduction and update user's credit balance
 * @param supabaseClient - Authenticated Supabase client
 * @param params - Credit deduction parameters
 * @returns Created credit deduction
 */
export const createCreditDeduction = async (
  supabaseClient: SupabaseClient,
  params: CreateCreditDeductionParams
): Promise<CreditDeduction> => {
  const now = new Date().toISOString();

  // First check if user has enough credits
  const { data: userCredits, error: creditsError } = await supabaseClient
    .from('user_credits')
    .select('*')
    .eq('user_id', params.user_id)
    .maybeSingle();

  if (creditsError) {
    throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
  }

  if (!userCredits) {
    throw new Error('User credits record not found');
  }

  if (userCredits.balance < params.amount) {
    throw new Error('Insufficient credits');
  }

  // Create the deduction record
  const { data: deduction, error: deductionError } = await supabaseClient
    .from('credit_deductions')
    .insert({
      id: params.id,
      user_id: params.user_id,
      amount: params.amount,
      reason: params.reason,
      session_id: params.session_id || null,
      exchange_id: params.exchange_id || null,
      created_at: now,
    })
    .select()
    .single();

  if (deductionError) {
    throw new Error(`Failed to create credit deduction: ${deductionError.message}`);
  }

  // Update user's credit balance
  await supabaseClient
    .from('user_credits')
    .update({
      balance: userCredits.balance - params.amount,
      total_used: userCredits.total_used + params.amount,
      updated_at: now,
    })
    .eq('user_id', params.user_id);

  return deduction;
};

