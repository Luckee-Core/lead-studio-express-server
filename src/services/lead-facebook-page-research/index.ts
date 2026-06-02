import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import { getLeadContactsByLeadId } from '../../data/lead-contacts';
import {
  hasActiveLeadFacebookPageResearch,
  pickNextLeadIdForFacebookPageResearch,
  createActiveLeadFacebookPageResearch,
  finalizeLeadFacebookPageResearch,
} from '../../data/lead-facebook-page-research';
import {
  getManualLeadIdFromBody,
  isWithinBusinessHours,
  verifyCronSecret,
} from '../lead-research-shared';
import { applyFacebookPageDetailsApifyToLead } from './applyFacebookPageDetailsApifyToLead';
import { hasAnyLeadContactWithEmailAndPhone } from '../../utils/lead-contacts';

/**
 * POST /api/services/lead-facebook-page-research
 * Cron: next eligible lead. Manual: JSON body `{ leadId }` runs that lead only (skips queue / business hours / global active lock).
 */
export const runLeadFacebookPageResearch = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const manualLeadId = getManualLeadIdFromBody(req);
  const supabase = getSupabaseClient();

  try {
    let leadId: string;

    if (manualLeadId) {
      leadId = manualLeadId;
    } else {
      if (!isWithinBusinessHours()) {
        res.status(200).json({ success: true, skipped: true, reason: 'outside_business_hours' });
        return;
      }

      if (await hasActiveLeadFacebookPageResearch(supabase)) {
        res.status(200).json({ success: true, skipped: true, reason: 'active_run_exists' });
        return;
      }

      const picked = await pickNextLeadIdForFacebookPageResearch(supabase);
      if (!picked) {
        res.status(200).json({ success: true, skipped: true, reason: 'no_eligible_lead' });
        return;
      }
      leadId = picked;
    }

    const run = await createActiveLeadFacebookPageResearch(supabase, leadId);
    const runId = run.id;

    try {
      const lead = await getLeadById(supabase, leadId);
      const profileUrl = lead?.facebook_url?.trim();
      if (!lead || !profileUrl) {
        await finalizeLeadFacebookPageResearch(supabase, runId, 'failed', {
          errorMessage: 'Lead or facebook_url missing',
        });
        res.status(400).json({ success: false, error: 'Lead or facebook_url missing' });
        return;
      }

      const contacts = await getLeadContactsByLeadId(supabase, leadId);
      if (hasAnyLeadContactWithEmailAndPhone(contacts)) {
        await finalizeLeadFacebookPageResearch(supabase, runId, 'succeeded', {
          payload: { skippedApify: true, reason: 'lead_has_complete_contact' },
        });
        res.status(200).json({
          success: true,
          leadId,
          runId,
          skipped: true,
          reason: 'lead_has_complete_contact',
        });
        return;
      }

      const apify = await applyFacebookPageDetailsApifyToLead(supabase, leadId, profileUrl);
      if (!apify.success) {
        await finalizeLeadFacebookPageResearch(supabase, runId, 'failed', {
          errorMessage: apify.error || 'Facebook page scraper failed',
        });
        res.status(200).json({
          success: false,
          leadId,
          runId,
          error: apify.error,
        });
        return;
      }

      await finalizeLeadFacebookPageResearch(supabase, runId, 'succeeded', {
        payload: {
          data: apify.data,
          contactCreated: Boolean(apify.contactCreated),
          contactMerged: Boolean(apify.contactMerged),
          leadEmailUpdated: Boolean(apify.leadEmailUpdated),
          leadPhoneUpdated: Boolean(apify.leadPhoneUpdated),
        },
      });

      res.status(200).json({ success: true, leadId, runId });
    } catch (inner: unknown) {
      const msg = inner instanceof Error ? inner.message : String(inner);
      await finalizeLeadFacebookPageResearch(supabase, runId, 'failed', { errorMessage: msg });
      throw inner;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadFacebookPageResearch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
