import type { SupabaseClient } from '@supabase/supabase-js';
import type { AICallResult } from '../business-coach/shared/callAI';
import type { LeadContactEmailDraftAiPayload } from './parseLeadContactEmailDraftJson';
import {
  createLeadContactEmailDraftAiExchange,
  createLeadContactEmailDraftAiRequest,
  createLeadContactEmailDraftAiResponse,
} from '../../data/lead-contact-email-draft-ai';

type PersistLeadContactEmailDraftAiAuditInput = {
  leadId: string;
  leadContactId: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
  requestPayloadJson: Record<string, unknown>;
  aiResult: AICallResult | null;
  callError?: string;
  parsed: LeadContactEmailDraftAiPayload | null;
};

const PARSE_ERROR_MESSAGE = 'Could not parse email draft from AI response';

/**
 * Persists request/response/exchange for a lead contact “Generate with AI” email draft call.
 * Does not throw — logging only — so credit deduction and API errors stay unchanged.
 */
export const persistLeadContactEmailDraftAiAudit = async (
  supabase: SupabaseClient,
  input: PersistLeadContactEmailDraftAiAuditInput,
): Promise<void> => {
  const {
    leadId,
    leadContactId,
    model,
    systemPrompt,
    userMessage,
    requestPayloadJson,
    aiResult,
    callError,
    parsed,
  } = input;

  try {
    const request = await createLeadContactEmailDraftAiRequest(supabase, {
      leadId,
      leadContactId,
      model,
      requestPayloadJson,
      systemPrompt,
      userMessage,
    });

    const success = Boolean(!callError && aiResult && parsed);
    const errorMessage = callError
      ? callError
      : aiResult && !parsed
        ? PARSE_ERROR_MESSAGE
        : null;

    const response = await createLeadContactEmailDraftAiResponse(supabase, {
      requestId: request.id,
      model: aiResult?.modelUsed ?? model,
      status: success ? 'success' : 'error',
      rawResponse: aiResult?.responseText ?? null,
      parsedResponseJson: parsed
        ? ({ subject: parsed.subject, body: parsed.body } as Record<string, unknown>)
        : null,
      errorMessage,
      usageInputTokens: aiResult?.inputTokens ?? null,
      usageOutputTokens: aiResult?.outputTokens ?? null,
    });

    await createLeadContactEmailDraftAiExchange(supabase, {
      leadId,
      leadContactId,
      requestId: request.id,
      responseId: response.id,
    });
  } catch (err: unknown) {
    console.error('❌ Failed to persist lead contact email draft AI audit:', err);
  }
};
