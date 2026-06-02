import { processResolveSinglePlatformSerp } from '../../../../ai/google-search/resolve-single-platform-serp';
import {
  createLeadGoogleSearchAiExchange,
  createLeadGoogleSearchAiRequest,
  createLeadGoogleSearchAiResponse,
} from '../../../../data/lead-google-search-ai';
import { getManagedAnthropicClient } from '../../../ai/anthropic-client';
import {
  facebookSerpCanonicalKey,
  urlLooksLikeFacebookProfileOrPage,
} from '../../../../utils/url/facebook-serp-url';
import type { FacebookSerpResolutionInput, FacebookSerpResolutionResult } from '../types';

/**
 * Resolution phase for Facebook profile search:
 * use AI to pick the best candidate URL and persist AI audit records.
 */
export const runFacebookSerpResolution = async (
  input: FacebookSerpResolutionInput
): Promise<FacebookSerpResolutionResult> => {
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
    console.log('🤖 lead-google-search/facebook: resolving single-platform SERP', {
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
      facebookGoogleSearchRunId: runId,
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
      facebookGoogleSearchRunId: runId,
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
      console.warn('⚠️ lead-google-search/facebook: AI resolution failed', aiError);
    } else {
      console.log('ℹ️ lead-google-search/facebook: no matching URL for platform', { leadId: lead.id });
    }
  } else if (serpLinks.length > 0 && !anthropic) {
    aiError = 'ANTHROPIC_API_KEY not configured';
    console.warn('⚠️ lead-google-search/facebook: skipping AI —', aiError);
  }

  if (!resolvedUrl && serpLinks.length > 0) {
    const candidates = new Map<string, string>();
    for (const row of serpLinks) {
      if (!urlLooksLikeFacebookProfileOrPage(row.url)) continue;
      const key = facebookSerpCanonicalKey(row.url);
      if (!key) continue;
      if (!candidates.has(key)) {
        try {
          const u = new URL(row.url);
          u.search = '';
          u.hash = '';
          candidates.set(key, u.toString());
        } catch {
          candidates.set(key, row.url.trim());
        }
      }
    }
    if (candidates.size === 1) {
      resolvedUrl = [...candidates.values()][0] ?? null;
      console.log(
        'ℹ️ lead-google-search/facebook: single Facebook SERP candidate after AI; using it',
        { leadId: lead.id, url: resolvedUrl }
      );
    }
  }

  return {
    resolvedUrl,
    aiError,
    resolveSerpPrompts,
    aiAudit,
  };
};
