import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mark request complete and link response/exchange.
 */
export const updateLeadContactChatRequestCompletion = async (
  supabase: SupabaseClient,
  requestId: string,
  params: {
    exchangeId: string;
    responseId: string;
    status: 'completed' | 'failed';
  },
): Promise<void> => {
  const { error } = await supabase
    .from('lead_contact_chat_requests')
    .update({
      exchange_id: params.exchangeId,
      response_id: params.responseId,
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('❌ updateLeadContactChatRequestCompletion:', error);
    throw new Error(error.message);
  }
};
