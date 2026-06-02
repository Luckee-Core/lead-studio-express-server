import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getLeadContactById } from '../../data/lead-contacts/get-by-id';
import { getLeadById } from '../../data/leads/get-by-id';
import {
  insertLeadContactChatExchange,
  insertLeadContactChatRequest,
  insertLeadContactChatResponse,
  listLeadContactChatExchangesForContact,
  listLeadContactChatRequestsByIds,
  listLeadContactChatResponsesByIds,
  updateLeadContactChatRequestCompletion,
} from '../../data/lead-contact-chat';
import { callAI } from '../business-coach/shared/callAI';
import { deductCredits } from '../business-coach/shared/deductCredits';
import {
  buildLeadContactChatSystemPrompt,
  buildLeadContactChatUserPayload,
} from './buildLeadContactChatPrompt';
import { parseLeadContactChatJson } from './parseLeadContactChatJson';

const TOKENS_PER_CREDIT = 11.11;
const MS_24H = 24 * 60 * 60 * 1000;

const buildStructuredPayload = (content: string): Record<string, unknown> => ({
  content,
});

const loadRecentChatLines = async (
  supabase: SupabaseClient,
  leadContactId: string,
  excludeRequestId: string,
): Promise<{ role: string; content: string }[]> => {
  const exchanges = await listLeadContactChatExchangesForContact(
    supabase,
    leadContactId,
  );
  const cutoff = Date.now() - MS_24H;
  const completed = exchanges.filter(
    (exchange) =>
      exchange.response_id &&
      exchange.request_id !== excludeRequestId &&
      new Date(exchange.created_at).getTime() >= cutoff,
  );
  if (completed.length === 0) {
    return [];
  }

  const requestIds = [...new Set(completed.map((exchange) => exchange.request_id))];
  const responseIds = completed
    .map((exchange) => exchange.response_id)
    .filter(Boolean) as string[];
  const [requestRows, responseRows] = await Promise.all([
    listLeadContactChatRequestsByIds(supabase, requestIds),
    listLeadContactChatResponsesByIds(supabase, responseIds),
  ]);
  const requestById = new Map(requestRows.map((row) => [row.id, row]));
  const responseById = new Map(responseRows.map((row) => [row.id, row]));

  const lines: { role: string; content: string }[] = [];
  for (const exchange of completed) {
    const request = requestById.get(exchange.request_id);
    if (request) {
      lines.push({ role: 'user', content: request.content });
    }
    if (exchange.response_id) {
      const response = responseById.get(exchange.response_id);
      const structured = (response?.structured ?? {}) as { content?: unknown };
      const content =
        typeof structured.content === 'string' ? structured.content : '';
      lines.push({ role: 'coach', content });
    }
  }

  return lines;
};

const persistExchangeOutcome = async (
  supabase: SupabaseClient,
  params: {
    userId: string;
    leadContactId: string;
    requestId: string;
    structured: Record<string, unknown>;
    ai: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      modelUsed: string;
    } | null;
    status: 'completed' | 'failed';
  },
): Promise<void> => {
  const responseId = uuidv4();
  await insertLeadContactChatResponse(supabase, responseId, params.structured);

  const exchangeId = uuidv4();
  const totalTokens = params.ai?.totalTokens ?? 0;
  const creditsUsed =
    params.ai && totalTokens > 0 ? Math.ceil(totalTokens / TOKENS_PER_CREDIT) : 0;

  await insertLeadContactChatExchange(supabase, {
    id: exchangeId,
    userId: params.userId,
    leadContactId: params.leadContactId,
    requestId: params.requestId,
    responseId,
    inputTokens: params.ai?.inputTokens ?? 0,
    outputTokens: params.ai?.outputTokens ?? 0,
    totalTokens,
    creditsUsed,
    tokensPerCredit: TOKENS_PER_CREDIT,
    modelUsed: params.ai?.modelUsed ?? 'none',
    status: params.status,
  });

  await updateLeadContactChatRequestCompletion(supabase, params.requestId, {
    exchangeId,
    responseId,
    status: params.status,
  });

  if (params.status === 'completed' && creditsUsed > 0) {
    await deductCredits(
      supabase,
      params.userId,
      creditsUsed,
      exchangeId,
      'lead_contact_chat',
    );
  }
};

/**
 * Persist user request, run AI coach, and store response/exchange rows.
 */
export const processLeadContactChat = async (
  supabase: SupabaseClient,
  anthropic: Anthropic | null,
  userId: string,
  leadContactId: string,
  userMessageContent: string,
): Promise<void> => {
  const contact = await getLeadContactById(supabase, leadContactId);
  if (!contact) {
    throw new Error('Lead contact not found');
  }

  const lead = await getLeadById(supabase, contact.lead_id);
  if (!lead) {
    throw new Error('Lead not found for contact');
  }

  const requestId = uuidv4();
  await insertLeadContactChatRequest(supabase, {
    id: requestId,
    userId,
    leadContactId,
    content: userMessageContent,
  });

  const fallback =
    'I could not generate a detailed response right now. Please try again in a moment.';

  try {
    const recentChat = await loadRecentChatLines(supabase, leadContactId, requestId);

    if (!anthropic) {
      await persistExchangeOutcome(supabase, {
        userId,
        leadContactId,
        requestId,
        structured: buildStructuredPayload(
          'AI is not configured. Add API keys to enable lead contact coaching.',
        ),
        ai: null,
        status: 'completed',
      });
      return;
    }

    const systemPrompt = buildLeadContactChatSystemPrompt();
    const userPayload = buildLeadContactChatUserPayload({
      contact: {
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
        status: contact.status,
      },
      lead: {
        businessName: lead.business_name,
        summary: lead.summary,
        categoryName: lead.category_name,
      },
      recentChat,
      userMessage: userMessageContent,
    });
    const aiResult = await callAI(
      anthropic,
      'lead_contact_chat',
      systemPrompt,
      userPayload,
    );
    const parsed = parseLeadContactChatJson(aiResult.responseText);
    const content = parsed?.content ?? fallback;

    await persistExchangeOutcome(supabase, {
      userId,
      leadContactId,
      requestId,
      structured: buildStructuredPayload(content),
      ai: {
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        totalTokens: aiResult.totalTokens,
        modelUsed: aiResult.modelUsed,
      },
      status: 'completed',
    });
  } catch (error: unknown) {
    console.error('❌ processLeadContactChat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    try {
      await persistExchangeOutcome(supabase, {
        userId,
        leadContactId,
        requestId,
        structured: buildStructuredPayload(`${fallback} (${message})`),
        ai: null,
        status: 'failed',
      });
    } catch (persistError: unknown) {
      console.error('❌ processLeadContactChat persist failure:', persistError);
    }
  }
};
