import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Persist token/credit ledger row for a batch auto-categorize AI call.
 */
export const insertLeadAutoCategorizeBatchExchange = async (
  supabase: SupabaseClient,
  params: {
    id: string;
    userId: string;
    requestId: string;
    responseId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    creditsUsed: number;
    tokensPerCredit: number;
    modelUsed: string;
    status: 'completed' | 'failed';
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_auto_categorize_batch_exchanges').insert({
    id: params.id,
    user_id: params.userId,
    request_id: params.requestId,
    response_id: params.responseId,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    total_tokens: params.totalTokens,
    credits_used: params.creditsUsed,
    tokens_per_credit: params.tokensPerCredit,
    model_used: params.modelUsed,
    status: params.status,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadAutoCategorizeBatchExchange:', error);
    throw new Error(error.message);
  }
};
