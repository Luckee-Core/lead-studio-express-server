import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { textToTiptapContent } from '../../data/lead-contact-emails/text-to-tiptap';
import { getModelConfig } from '../../services/ai/model-config';
import { callAI } from '../business-coach/shared/callAI';
import { deductCredits } from '../business-coach/shared/deductCredits';
import {
  applyMandatoryStructureToPlainEmailBody,
  normalizePlainEmailTypography,
} from './emailDraftPersonaStructure';
import { parseLeadContactEmailDraftJson } from './parseLeadContactEmailDraftJson';
import { persistLeadContactEmailDraftAiAudit } from './persistLeadContactEmailDraftAiAudit';

const TOKENS_PER_CREDIT = 11.11;

export type GenerateLeadContactEmailDraftResult = {
  subject: string;
  body: ReturnType<typeof textToTiptapContent>;
};

export type RunLeadContactEmailDraftGenerationParams = {
  supabase: SupabaseClient;
  anthropic: Anthropic;
  userId: string;
  leadContactId: string;
  leadId: string;
  emailPersona: Record<string, string>;
  systemPrompt: string;
  userPayload: string;
  messageType: 'lead_contact_email_draft' | 'lead_contact_email_followup_draft';
  requestPayloadJson: Record<string, unknown>;
};

/**
 * Shared path: call AI, persist audit, deduct credits, return TipTap body + subject.
 */
export const runLeadContactEmailDraftGeneration = async (
  params: RunLeadContactEmailDraftGenerationParams,
): Promise<GenerateLeadContactEmailDraftResult> => {
  const {
    supabase,
    anthropic,
    userId,
    leadContactId,
    leadId,
    emailPersona,
    systemPrompt,
    userPayload,
    messageType,
    requestPayloadJson,
  } = params;

  const draftModel = getModelConfig(messageType).model;

  let aiResult: Awaited<ReturnType<typeof callAI>> | null = null;
  let callError: string | undefined;
  try {
    aiResult = await callAI(anthropic, messageType, systemPrompt, userPayload);
  } catch (err: unknown) {
    callError = err instanceof Error ? err.message : String(err);
  }

  const parsed = aiResult ? parseLeadContactEmailDraftJson(aiResult.responseText) : null;

  await persistLeadContactEmailDraftAiAudit(supabase, {
    leadId,
    leadContactId,
    model: draftModel,
    systemPrompt,
    userMessage: userPayload,
    requestPayloadJson,
    aiResult,
    callError,
    parsed,
  });

  if (callError) {
    throw new Error(callError);
  }
  if (!aiResult) {
    throw new Error('AI call did not return a result');
  }
  if (!parsed) {
    throw new Error('Could not parse email draft from AI response');
  }

  const deductionId = uuidv4();
  const totalTokens = aiResult.totalTokens;
  const creditsUsed =
    totalTokens > 0 ? Math.ceil(totalTokens / TOKENS_PER_CREDIT) : 0;
  if (creditsUsed > 0) {
    await deductCredits(supabase, userId, creditsUsed, deductionId, messageType);
  }

  const plainBody = normalizePlainEmailTypography(
    applyMandatoryStructureToPlainEmailBody(parsed.body, emailPersona),
  );
  const subject = normalizePlainEmailTypography(parsed.subject.trim());

  return {
    subject,
    body: textToTiptapContent(plainBody),
  };
};
