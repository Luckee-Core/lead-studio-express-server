import { Request, Response } from 'express';
import { routeParam } from '../../../utils/express/route-param';
import { createSupabaseClient } from '../../../services/supabase/create-supabase-client';
import {
  listLeadContactChatExchangesForContact,
  listLeadContactChatRequestsByIds,
  listLeadContactChatResponsesByIds,
} from '../../../data/lead-contact-chat';
import type { LeadContactChatMessage } from '../types';

/**
 * GET /api/lead-contact-chat/:leadContactId/messages
 * Optional query `userId` scopes history; omit to return all exchanges for the contact (single-tenant).
 */
export const getMessagesHandler = async (req: Request, res: Response) => {
  try {
    const leadContactId = routeParam(req.params.leadContactId);
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
    if (!leadContactId) {
      return res.status(400).json({ success: false, error: 'leadContactId is required' });
    }

    const supabase = createSupabaseClient(req);
    const exchanges = await listLeadContactChatExchangesForContact(
      supabase,
      leadContactId,
    );
    const scoped = userId
      ? exchanges.filter((exchange) => exchange.user_id === userId)
      : exchanges;

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

    const messages: LeadContactChatMessage[] = [];
    for (const exchange of scoped) {
      const request = requestById.get(exchange.request_id);
      if (request) {
        messages.push({
          id: request.id,
          role: 'user',
          content: request.content,
          timestamp: new Date(request.created_at).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
          rawTime: request.created_at,
        });
      }

      if (exchange.response_id) {
        const response = responseById.get(exchange.response_id);
        const structured = (response?.structured ?? {}) as { content?: unknown };
        messages.push({
          id: exchange.response_id,
          role: 'coach',
          content:
            typeof structured.content === 'string'
              ? structured.content
              : 'No response content.',
          timestamp: new Date(exchange.created_at).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
          rawTime: exchange.created_at,
        });
      }
    }

    return res.json({ success: true, messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ getMessagesHandler:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
