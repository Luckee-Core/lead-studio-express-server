import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProcessFacebookActivityScoreResponse } from '../../ai/leads/facebook-activity-score';
import {
  createLeadFacebookPostsAiExchange,
  createLeadFacebookPostsAiRequest,
  createLeadFacebookPostsAiResponse,
} from '../../data/lead-facebook-posts-ai';

type PersistLeadFacebookPostsAiActivityAuditInput = {
  leadId: string;
  postsResearchRunId: string | null;
  pageUrl: string;
  postCount: number;
  ai: ProcessFacebookActivityScoreResponse;
};

/**
 * Persists request/response/exchange rows for a Facebook activity score Anthropic call.
 * Swallows DB errors so score persistence is not blocked by audit failures.
 */
export const persistLeadFacebookPostsAiActivityAudit = async (
  supabase: SupabaseClient,
  input: PersistLeadFacebookPostsAiActivityAuditInput,
): Promise<void> => {
  const { leadId, postsResearchRunId, pageUrl, postCount, ai } = input;
  try {
    const requestPayloadJson: Record<string, unknown> = {
      kind: 'facebook_activity_score',
      pageUrl,
      postCount,
    };
    const request = await createLeadFacebookPostsAiRequest(supabase, {
      leadId,
      postsResearchRunId,
      model: ai.model,
      requestPayloadJson,
      systemPrompt: ai.prompts.systemPrompt,
      userMessage: ai.prompts.userMessage,
    });
    const status = ai.success ? 'success' : 'error';
    const parsedJson = ai.success
      ? ({ ...ai.data } as Record<string, unknown>)
      : null;
    const response = await createLeadFacebookPostsAiResponse(supabase, {
      requestId: request.id,
      model: ai.model,
      status,
      rawResponse: ai.rawResponse ?? null,
      parsedResponseJson: parsedJson,
      errorMessage: ai.success ? null : (ai.error ?? null),
      usageInputTokens: ai.usage?.input_tokens ?? null,
      usageOutputTokens: ai.usage?.output_tokens ?? null,
    });
    await createLeadFacebookPostsAiExchange(supabase, {
      leadId,
      postsResearchRunId,
      requestId: request.id,
      responseId: response.id,
    });
  } catch (err: unknown) {
    console.error('❌ Failed to persist lead Facebook posts AI audit:', err);
  }
};
