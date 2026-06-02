import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Persist parsed AI response payload.
 */
export const insertLeadContactChatResponse = async (
  supabase: SupabaseClient,
  id: string,
  structured: unknown,
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_contact_chat_responses').insert({
    id,
    structured,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadContactChatResponse:', error);
    throw new Error(error.message);
  }
};
