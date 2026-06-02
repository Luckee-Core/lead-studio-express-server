import type { SupabaseClient } from '@supabase/supabase-js';
import {
  processFacebookActivityScore,
  type FacebookActivityScoreResult,
} from '../../ai/leads/facebook-activity-score';
import { runFacebookPostsScraper } from '../../domains/facebook-posts/run';
import { finalizeLeadFacebookPostsResearch } from '../../data/lead-facebook-posts-research';
import { getManagedAnthropicClient } from '../../services/ai';
import {
  extractFacebookPostLikeObjectsFromScraperData,
  normalizeFacebookPostsForActivityFromScraperData,
} from '../../utils/facebook';
import { persistLeadFacebookPostsAiActivityAudit } from './persist-lead-facebook-posts-ai-activity-audit';

export type ExecuteLeadFacebookPostsResearchRunParams = {
  supabase: SupabaseClient;
  runId: string;
  leadId: string;
  profileUrl: string;
  businessName: string;
  /** `fetch_only` persists posts only; `fetch_and_score` runs AI after scrape. */
  phase: 'fetch_only' | 'fetch_and_score';
};

/**
 * Scrapes Facebook posts, optionally scores cadence with AI, and finalizes the research row payload.
 */
export const executeLeadFacebookPostsResearchRun = async (
  params: ExecuteLeadFacebookPostsResearchRunParams
): Promise<{ body: Record<string, unknown> }> => {
  const { supabase, runId, leadId, profileUrl, businessName, phase } = params;

  const result = await runFacebookPostsScraper({ profileUrl });
  if (!result.success) {
    await finalizeLeadFacebookPostsResearch(supabase, runId, 'failed', {
      errorMessage: result.error || 'Facebook posts scraper failed',
    });
    return {
      body: {
        success: false,
        leadId,
        runId,
        error: result.error,
      },
    };
  }

  const rawPostObjects = extractFacebookPostLikeObjectsFromScraperData(result.data).slice(0, 5);

  const normalizedPosts = normalizeFacebookPostsForActivityFromScraperData(result.data, 12);

  let activityScore: FacebookActivityScoreResult | null = null;
  let activityScoreError: string | undefined;

  const runAi = phase === 'fetch_and_score';
  if (runAi) {
    if (normalizedPosts.length === 0) {
      activityScore = {
        activityScore: 0,
        confidence: 'low',
        postingPattern: 'no_posts_extracted',
        evidence: 'Scraper returned no post text we could parse for dates or captions.',
        limitations: 'Empty or unrecognized post payload.',
      };
    } else {
      const anthropic = getManagedAnthropicClient();
      if (!anthropic) {
        activityScoreError = 'Anthropic client not configured';
      } else {
        const scored = await processFacebookActivityScore(anthropic, {
          businessName: businessName.trim() || 'Unknown business',
          pageUrl: profileUrl.trim(),
          posts: normalizedPosts,
        });
        if (scored.success) {
          activityScore = scored.data;
        } else {
          activityScoreError = scored.error;
        }
        await persistLeadFacebookPostsAiActivityAudit(supabase, {
          leadId,
          postsResearchRunId: runId,
          pageUrl: profileUrl.trim(),
          postCount: normalizedPosts.length,
          ai: scored,
        });
      }
    }
  }

  /** Persist slim fields only — raw Apify items are huge (video manifests, etc.); debug via server logs. */
  const payload: Record<string, unknown> = {
    scraperSource: result.scraperSource ?? null,
    postCount: rawPostObjects.length,
    normalizedPosts,
    ...(runAi
      ? {
          activityScore,
          ...(activityScoreError ? { activityScoreError } : {}),
        }
      : {
          activityScore: null,
        }),
  };
  if (!runAi) {
    delete (payload as { activityScoreError?: string }).activityScoreError;
  }

  await finalizeLeadFacebookPostsResearch(supabase, runId, 'succeeded', { payload });

  return {
    body: {
      success: true,
      leadId,
      runId,
      activityScore: runAi ? activityScore : null,
      activityScoreError: runAi ? (activityScoreError ?? null) : null,
      step: runAi ? 'fetch_and_score' : 'fetch_posts',
    },
  };
};
