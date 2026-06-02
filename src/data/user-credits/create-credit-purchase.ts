import { SupabaseClient } from '@supabase/supabase-js';
import { UserCredits } from './get-user-credits-by-user';

/**
 * CreditPurchase interface
 */
export interface CreditPurchase {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  product_id: string;
  platform: 'ios' | 'android' | 'web';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for creating a credit purchase
 */
export interface CreateCreditPurchaseParams {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  product_id: string;
  platform: 'ios' | 'android' | 'web';
  status?: 'pending' | 'completed' | 'failed';
}

/**
 * Create a credit purchase and update user's credit balance
 * @param supabaseClient - Authenticated Supabase client
 * @param params - Credit purchase parameters
 * @returns Created credit purchase
 */
export const createCreditPurchase = async (
  supabaseClient: SupabaseClient,
  params: CreateCreditPurchaseParams
): Promise<CreditPurchase> => {
  const now = new Date().toISOString();

  // Create the purchase record
  const { data: purchase, error: purchaseError } = await supabaseClient
    .from('credit_purchases')
    .insert({
      id: params.id,
      user_id: params.user_id,
      amount: params.amount,
      transaction_id: params.transaction_id,
      product_id: params.product_id,
      platform: params.platform,
      status: params.status || 'completed',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (purchaseError) {
    throw new Error(`Failed to create credit purchase: ${purchaseError.message}`);
  }

  // Update user's credit balance if status is completed
  if ((params.status || 'completed') === 'completed') {
    // Check if user_credits record exists
    const { data: existingCredits } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', params.user_id)
      .maybeSingle();

    if (existingCredits) {
      // Update existing record
      await supabaseClient
        .from('user_credits')
        .update({
          balance: existingCredits.balance + params.amount,
          total_purchased: existingCredits.total_purchased + params.amount,
          updated_at: now,
        })
        .eq('user_id', params.user_id);
    } else {
      // Create new user_credits record
      await supabaseClient.from('user_credits').insert({
        id: `credits_${params.user_id}`,
        user_id: params.user_id,
        balance: params.amount,
        total_purchased: params.amount,
        total_used: 0,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return purchase;
};

