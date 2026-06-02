import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import {
  hasActiveLeadFacebookPostsResearch,
  pickNextLeadIdForFacebookPostsResearch,
  createActiveLeadFacebookPostsResearch,
  finalizeLeadFacebookPostsResearch,
  getLatestSucceededFacebookPostsResearchByLeadId,
} from '../../data/lead-facebook-posts-research';
import {
  getFacebookPostsResearchStepFromBody,
  getForceFacebookPostsResearchFromBody,
  getManualLeadIdFromBody,
  isWithinBusinessHours,
  verifyCronSecret,
} from '../lead-research-shared';
import { executeLeadFacebookPostsResearchRun } from './execute-lead-facebook-posts-research-run';
import { executeLeadFacebookPostsScoreOnly } from './execute-lead-facebook-posts-score-only';

/**
 * POST /api/services/lead-facebook-posts-research
 * Cron: next eligible lead (business hours, global active lock, queue RPC).
 * Manual: JSON body `{ leadId, step?: "fetch_posts" | "score_posts" }`.
 * - `fetch_posts`: Apify only (saved posts, no AI). `score_posts`: AI only from last saved posts.
 * - Omitted `step` = full pipeline (same as cron). `full` + existing succeeded row skips unless `force: true`.
 */
export const runLeadFacebookPostsResearch = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const manualLeadId = getManualLeadIdFromBody(req);
  const step = getFacebookPostsResearchStepFromBody(req);
  const forceFacebookPostsResearch = getForceFacebookPostsResearchFromBody(req);
  const supabase = getSupabaseClient();

  try {
    if (manualLeadId && step === 'score_posts') {
      const lead = await getLeadById(supabase, manualLeadId);
      const profileUrl = lead?.facebook_url?.trim();
      if (!lead || !profileUrl) {
        res.status(400).json({ success: false, error: 'Lead or facebook_url missing' });
        return;
      }
      const businessName = lead.business_name?.trim() || lead.name?.trim() || '';
      const outcome = await executeLeadFacebookPostsScoreOnly({
        supabase,
        leadId: manualLeadId,
        profileUrl,
        businessName,
      });
      res.status(outcome.httpStatus).json(outcome.body);
      return;
    }

    let leadId: string;

    if (manualLeadId) {
      leadId = manualLeadId;
      if (step === 'full' && !forceFacebookPostsResearch) {
        const existing = await getLatestSucceededFacebookPostsResearchByLeadId(supabase, leadId);
        if (existing) {
          let activityScore: unknown = null;
          let activityScoreError: unknown = null;
          const payload = existing.payload;
          if (payload && typeof payload === 'object') {
            const p = payload as Record<string, unknown>;
            activityScore = p.activityScore ?? null;
            activityScoreError = p.activityScoreError ?? null;
          }
          res.status(200).json({
            success: true,
            skipped: true,
            reason: 'already_succeeded',
            leadId,
            runId: existing.id,
            activityScore,
            activityScoreError,
          });
          return;
        }
      }
    } else {
      if (!isWithinBusinessHours()) {
        res.status(200).json({ success: true, skipped: true, reason: 'outside_business_hours' });
        return;
      }

      if (await hasActiveLeadFacebookPostsResearch(supabase)) {
        res.status(200).json({ success: true, skipped: true, reason: 'active_run_exists' });
        return;
      }

      const picked = await pickNextLeadIdForFacebookPostsResearch(supabase);
      if (!picked) {
        res.status(200).json({ success: true, skipped: true, reason: 'no_eligible_lead' });
        return;
      }
      leadId = picked;
    }

    const run = await createActiveLeadFacebookPostsResearch(supabase, leadId);
    const runId = run.id;

    try {
      const lead = await getLeadById(supabase, leadId);
      const profileUrl = lead?.facebook_url?.trim();
      if (!lead || !profileUrl) {
        await finalizeLeadFacebookPostsResearch(supabase, runId, 'failed', {
          errorMessage: 'Lead or facebook_url missing',
        });
        res.status(400).json({ success: false, error: 'Lead or facebook_url missing' });
        return;
      }

      const businessName = lead.business_name?.trim() || lead.name?.trim() || '';

      const phase: 'fetch_only' | 'fetch_and_score' =
        manualLeadId && step === 'fetch_posts' ? 'fetch_only' : 'fetch_and_score';

      const outcome = await executeLeadFacebookPostsResearchRun({
        supabase,
        runId,
        leadId,
        profileUrl,
        businessName,
        phase,
      });

      res.status(200).json(outcome.body);
    } catch (inner: unknown) {
      const msg = inner instanceof Error ? inner.message : String(inner);
      await finalizeLeadFacebookPostsResearch(supabase, runId, 'failed', { errorMessage: msg });
      throw inner;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadFacebookPostsResearch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
