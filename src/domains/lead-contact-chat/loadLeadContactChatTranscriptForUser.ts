import { SupabaseClient } from '@supabase/supabase-js';
import {
  listLeadContactChatExchangesForContact,
  listLeadContactChatRequestsByIds,
  listLeadContactChatResponsesByIds,
} from '../../data/lead-contact-chat';

/**
 * Builds a plain-text transcript of lead-contact coaching chat for the given user.
 */
export const loadLeadContactChatTranscriptForUser = async (
  supabase: SupabaseClient,
  leadContactId: string,
  userId: string,
): Promise<string> => {
  const exchanges = await listLeadContactChatExchangesForContact(
    supabase,
    leadContactId,
  );
  const scoped = exchanges.filter((exchange) => exchange.user_id === userId);

  const requestIds = [...new Set(scoped.map((exchange) => exchange.request_id))];
  const responseIds = scoped
    .map((exchange) => exchange.response_id)
    .filter(Boolean) as string[];
  const [requestRows, responseRows] = await Promise.all([
    listLeadContactChatRequestsByIds(supabase, requestIds),
    listLeadContactChatResponsesByIds(supabase, responseIds),
  ]);
  const requestById = new Map(requestRows.map((row) => [row.id, row]));
  const responseById = new Map(responseRows.map((row) => [row.id, row]));

  const lines: string[] = [];
  for (const exchange of scoped) {
    const request = requestById.get(exchange.request_id);
    if (request) {
      lines.push(`User: ${request.content}`);
    }
    if (exchange.response_id) {
      const response = responseById.get(exchange.response_id);
      const structured = (response?.structured ?? {}) as { content?: unknown };
      const content =
        typeof structured.content === 'string'
          ? structured.content
          : 'No response content.';
      lines.push(`Coach: ${content}`);
    }
  }

  if (lines.length === 0) {
    return '(No prior chat for this contact.)';
  }
  return lines.join('\n\n');
};
