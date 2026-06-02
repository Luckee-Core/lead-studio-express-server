import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactChatResponseListRow = {
  id: string;
  structured: unknown;
  created_at: string;
};

/**
 * Fetch response rows for a set of IDs.
 */
export const listLeadContactChatResponsesByIds = async (
  supabase: SupabaseClient,
  ids: string[],
): Promise<LeadContactChatResponseListRow[]> => {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('lead_contact_chat_responses')
    .select('id, structured, created_at')
    .in('id', ids);

  if (error) {
    console.error('❌ listLeadContactChatResponsesByIds:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as LeadContactChatResponseListRow[];
};
