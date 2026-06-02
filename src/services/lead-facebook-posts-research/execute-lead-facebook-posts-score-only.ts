import type { SupabaseClient } from '@supabase/supabase-js';
import {
  processFacebookActivityScore,
  type FacebookActivityScoreResult,
} from '../../ai/leads/facebook-activity-score';
import {
  getLatestSucceededFacebookPostsResearchByLeadId,
  updateLeadFacebookPostsResearchPayloadById,
} from '../../data/lead-facebook-posts-research';
import { getManagedAnthropicClient } from '../../services/ai';
import type { NormalizedFacebookPostForActivity } from '../../utils/facebook';
import { persistLeadFacebookPostsAiActivityAudit } from './persist-lead-facebook-posts-ai-activity-audit';

export type ExecuteLeadFacebookPostsScoreOnlyParams = {
  supabase: SupabaseClient;
  leadId: string;
  profileUrl: string;
  businessName: string;
};

/**
 * Scores posting cadence from the latest succeeded run’s `normalizedPosts` (no Apify).
 */
export const executeLeadFacebookPostsScoreOnly = async (
  params: ExecuteLeadFacebookPostsScoreOnlyParams
): Promise<{ body: Record<string, unknown>; httpStatus: number }> => {
  const { supabase, leadId, profileUrl, businessName } = params;

  const latest = await getLatestSucceededFacebookPostsResearchByLeadId(supabase, leadId);
  if (!latest) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        error: 'No saved Facebook posts yet. Run post retrieval first.',
        leadId,
      },
    };
  }

  const rawPayload = latest.payload;
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      httpStatus: 400,
      body: {
        success: false,
        error: 'Stored research payload is missing.',
        leadId,
      },
    };
  }

  const prev = { ...(rawPayload as Record<string, unknown>) };
  const normalizedPosts = prev.normalizedPosts;
  if (!Array.isArray(normalizedPosts) || normalizedPosts.length === 0) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        error: 'No posts to score. Run post retrieval first.',
        leadId,
      },
    };
  }

  const posts = normalizedPosts as NormalizedFacebookPostForActivity[];

  let activityScore: FacebookActivityScoreResult | null = null;
  let activityScoreError: string | undefined;

  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    activityScoreError = 'Anthropic client not configured';
  } else {
    const scored = await processFacebookActivityScore(anthropic, {
      businessName: businessName.trim() || 'Unknown business',
      pageUrl: profileUrl.trim(),
      posts,
    });
    if (scored.success) {
      activityScore = scored.data;
    } else {
      activityScoreError = scored.error;
    }
    await persistLeadFacebookPostsAiActivityAudit(supabase, {
      leadId,
      postsResearchRunId: latest.id,
      pageUrl: profileUrl.trim(),
      postCount: posts.length,
      ai: scored,
    });
  }

  const nextPayload: Record<string, unknown> = { ...prev };
  if (activityScore) {
    nextPayload.activityScore = activityScore;
    delete nextPayload.activityScoreError;
  } else if (activityScoreError) {
    nextPayload.activityScoreError = activityScoreError;
  }

  await updateLeadFacebookPostsResearchPayloadById(supabase, latest.id, nextPayload);

  if (!activityScore && activityScoreError) {
    return {
      httpStatus: 502,
      body: {
        success: false,
        error: activityScoreError,
        leadId,
        runId: latest.id,
        activityScore: null,
        activityScoreError,
      },
    };
  }

  return {
    httpStatus: 200,
    body: {
      success: true,
      leadId,
      runId: latest.id,
      activityScore,
      activityScoreError: null,
    },
  };
};
