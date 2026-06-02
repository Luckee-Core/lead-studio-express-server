import { processResolveSinglePlatformSerp } from '../../../../ai/google-search/resolve-single-platform-serp';
import {
  createLeadGoogleSearchAiExchange,
  createLeadGoogleSearchAiRequest,
  createLeadGoogleSearchAiResponse,
} from '../../../../data/lead-google-search-ai';
import { getManagedAnthropicClient } from '../../../ai/anthropic-client';
import type { InstagramSerpResolutionInput, InstagramSerpResolutionResult } from '../types';

/**
 * Resolution phase for Instagram profile search:
 * use AI to pick the best candidate URL and persist AI audit records.
 */
export const runInstagramSerpResolution = async (
  input: InstagramSerpResolutionInput
): Promise<InstagramSerpResolutionResult> => {
  const {
    supabase,
    lead,
    runId,
    platform,
    city,
    state,
    knownHost,
    serpQuery,
    serpLinks,
    primaryWebsite,
  } = input;

  let resolvedUrl: string | null = null;
  let resolveSerpPrompts: { systemPrompt: string; userMessage: string } | null = null;
  let aiError: string | undefined;
  let aiAudit:
    | {
        requestId: string;
        responseId: string;
        exchangeId: string;
      }
    | undefined;

  const anthropic = getManagedAnthropicClient();
  if (serpLinks.length > 0 && anthropic) {
    console.log('🤖 lead-google-search/instagram: resolving single-platform SERP', {
      leadId: lead.id,
      rowCount: serpLinks.length,
    });
    const ai = await processResolveSinglePlatformSerp(anthropic, {
      platform,
      businessName: lead.business_name,
      city,
      state,
      results: serpLinks,
      knownWebsiteHost: knownHost,
    });
    if (ai.prompts) {
      resolveSerpPrompts = {
        systemPrompt: ai.prompts.systemPrompt,
        userMessage: ai.prompts.userMessage,
      };
    }
    const aiRequest = await createLeadGoogleSearchAiRequest(supabase, {
      leadId: lead.id,
      researchRunId: runId,
      model: ai.model || 'unknown',
      requestPayloadJson: {
        serpKind: 'single_platform',
        platform,
        serpQuery,
        primaryWebsite,
        businessName: lead.business_name,
        city,
        state,
        results: serpLinks,
      },
      systemPrompt: ai.prompts?.systemPrompt || '',
      userMessage: ai.prompts?.userMessage || '',
    });
    const aiResponse = await createLeadGoogleSearchAiResponse(supabase, {
      requestId: aiRequest.id,
      model: ai.model || 'unknown',
      status: ai.success ? 'success' : 'error',
      rawResponse: ai.rawResponse || null,
      parsedResponseJson: ai.success ? { url: ai.url ?? null, platform } : null,
      errorMessage: ai.error || null,
      usageInputTokens: ai.usage?.input_tokens ?? null,
      usageOutputTokens: ai.usage?.output_tokens ?? null,
    });
    const exchange = await createLeadGoogleSearchAiExchange(supabase, {
      leadId: lead.id,
      researchRunId: runId,
      requestId: aiRequest.id,
      responseId: aiResponse.id,
    });
    aiAudit = {
      requestId: aiRequest.id,
      responseId: aiResponse.id,
      exchangeId: exchange.id,
    };

    if (ai.success && ai.url) {
      resolvedUrl = ai.url;
    } else if (!ai.success) {
      aiError = ai.error || 'AI resolution failed';
      console.warn('⚠️ lead-google-search/instagram: AI resolution failed', aiError);
    } else {
      console.log('ℹ️ lead-google-search/instagram: no matching URL for platform', { leadId: lead.id });
    }
  } else if (serpLinks.length > 0 && !anthropic) {
    aiError = 'ANTHROPIC_API_KEY not configured';
    console.warn('⚠️ lead-google-search/instagram: skipping AI —', aiError);
  }

  return {
    resolvedUrl,
    aiError,
    resolveSerpPrompts,
    aiAudit,
  };
};
