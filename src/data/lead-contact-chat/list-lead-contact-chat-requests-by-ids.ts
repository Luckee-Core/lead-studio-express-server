import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactChatRequestListRow = {
  id: string;
  content: string;
  created_at: string;
};

/**
 * Fetch request rows for a set of IDs.
 */
export const listLeadContactChatRequestsByIds = async (
  supabase: SupabaseClient,
  ids: string[],
): Promise<LeadContactChatRequestListRow[]> => {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('lead_contact_chat_requests')
    .select('id, content, created_at')
    .in('id', ids);

  if (error) {
    console.error('❌ listLeadContactChatRequestsByIds:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as LeadContactChatRequestListRow[];
};
