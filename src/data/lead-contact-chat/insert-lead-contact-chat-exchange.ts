import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Insert lead contact chat exchange with token + model metadata.
 */
export const insertLeadContactChatExchange = async (
  supabase: SupabaseClient,
  params: {
    id: string;
    userId: string;
    leadContactId: string;
    requestId: string;
    responseId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    creditsUsed: number;
    tokensPerCredit: number;
    modelUsed: string;
    status: 'completed' | 'failed';
  },
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_contact_chat_exchanges').insert({
    id: params.id,
    user_id: params.userId,
    lead_contact_id: params.leadContactId,
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
    console.error('❌ insertLeadContactChatExchange:', error);
    throw new Error(error.message);
  }
};
