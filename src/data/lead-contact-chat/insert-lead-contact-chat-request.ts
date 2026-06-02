import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Insert pending lead contact chat request (user message).
 */
export const insertLeadContactChatRequest = async (
  supabase: SupabaseClient,
  params: {
    id: string;
    userId: string;
    leadContactId: string;
    content: string;
  },
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_contact_chat_requests').insert({
    id: params.id,
    user_id: params.userId,
    lead_contact_id: params.leadContactId,
    content: params.content,
    status: 'pending',
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadContactChatRequest:', error);
    throw new Error(error.message);
  }
};
