import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactChatExchangeRow = {
  id: string;
  user_id: string;
  lead_contact_id: string;
  request_id: string;
  response_id: string | null;
  created_at: string;
};

/**
 * Exchanges for one lead contact, oldest first.
 */
export const listLeadContactChatExchangesForContact = async (
  supabase: SupabaseClient,
  leadContactId: string,
): Promise<LeadContactChatExchangeRow[]> => {
  const { data, error } = await supabase
    .from('lead_contact_chat_exchanges')
    .select('id, user_id, lead_contact_id, request_id, response_id, created_at')
    .eq('lead_contact_id', leadContactId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ listLeadContactChatExchangesForContact:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as LeadContactChatExchangeRow[];
};
