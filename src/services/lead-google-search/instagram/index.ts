import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../../db/supabase-client';
import { updateLead } from '../../../data/leads/update';
import {
  createActiveLeadGoogleSearchResearch,
  finalizeLeadGoogleSearchResearch,
} from '../../../data/lead-google-search-research';
import { getManualLeadIdFromBody, verifyCronSecret } from '../../lead-research-shared';
import { runInstagramSerpDiscovery, runInstagramSerpResolution } from './process';

/**
 * POST /api/services/lead-google-search/instagram — manual only.
 *
 * Body must include `leadId`.
 */
export const runLeadGoogleSearchInstagram = async (req: Request, res: Response): Promise<void> => {
  // Guardrail: only trusted worker/manual callers can run this service.
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  // Manual-only execution: if no leadId is provided, skip legacy cron-style calls.
  const manualLeadId = getManualLeadIdFromBody(req);
  if (!manualLeadId) {
    res.status(200).json({ success: true, skipped: true, reason: 'cron_disabled' });
    return;
  }

  const supabase = getSupabaseClient();
  const leadId = manualLeadId;

  try {
    // Track this run in research state so we can persist succeeded/failed outcomes.
    const run = await createActiveLeadGoogleSearchResearch(supabase, leadId);
    const runId = run.id;

    try {
      // Phase 1: Discovery. Build lead context and scrape candidate Instagram URLs from Google.
      const discovery = await runInstagramSerpDiscovery({ supabase, leadId });
      // Phase 2: Resolution. Use AI to choose the best match from discovery candidates.
      const resolution = await runInstagramSerpResolution({
        supabase,
        runId,
        ...discovery,
      });

      // Persist the winning profile URL back to the lead record when confidence is high enough.
      let leadUpdated = false;
      if (resolution.resolvedUrl) {
        await updateLead(supabase, discovery.lead.id, { instagram_url: resolution.resolvedUrl });
        leadUpdated = true;
        console.log('💾 lead-google-search/instagram: lead URL updated', { leadId: discovery.lead.id });
      }

      // Persist structured run output for observability, retries, and analytics.
      const payload: Record<string, unknown> = {
        platform: discovery.platform,
        serpQuery: discovery.serpQuery,
        serpLinks: discovery.serpLinks,
        leadUpdated,
      };
      if (resolution.resolvedUrl !== null) payload.resolvedUrl = resolution.resolvedUrl;
      if (resolution.aiAudit) payload.aiAudit = resolution.aiAudit;
      if (resolution.aiError) payload.aiError = resolution.aiError;
      await finalizeLeadGoogleSearchResearch(supabase, runId, 'succeeded', {
        payload,
      });

      // Return a stable response contract for UI + worker consumers.
      res.status(200).json({
        success: true,
        leadId,
        runId,
        platform: discovery.platform,
        linkCount: discovery.serpLinks.length,
        hasProfiles: Boolean(resolution.resolvedUrl),
        leadUpdated,
        websiteUrls: [],
        resolveSerpPrompts: resolution.resolveSerpPrompts,
      });
    } catch (inner: unknown) {
      // Ensure run status is finalized even when an inner phase fails.
      const msg = inner instanceof Error ? inner.message : String(inner);
      await finalizeLeadGoogleSearchResearch(supabase, runId, 'failed', {
        errorMessage: msg,
      });
      throw inner;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadGoogleSearchInstagram:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
