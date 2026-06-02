import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../../db/supabase-client';
import { getManualLeadIdFromBody, verifyCronSecret } from '../../lead-research-shared';
import type { FacebookGoogleSearchRequestSource } from '../../../data/facebook-google-search';
import { processFacebookGoogleSearchForLead } from './process-facebook-google-search-for-lead';

export { processFacebookGoogleSearchForLead } from './process-facebook-google-search-for-lead';

/**
 * POST /api/services/lead-google-search/facebook — manual only.
 *
 * Body must include `leadId`.
 *
 * After SERP resolves a Facebook URL, runs Apify when no contact has **both** email and phone
 * (partial contacts still get Facebook to fill email/phone or add a second row when numbers differ).
 */
export const runLeadGoogleSearchFacebook = async (req: Request, res: Response): Promise<void> => {
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

  const rawSource =
    typeof (req.body as { facebookRequestSource?: unknown })?.facebookRequestSource === 'string'
      ? String((req.body as { facebookRequestSource: string }).facebookRequestSource)
          .trim()
          .toLowerCase()
      : '';
  const requestSource: FacebookGoogleSearchRequestSource =
    rawSource === 'leads_table' ? 'leads_table' : 'lead_detail';

  try {
    const out = await processFacebookGoogleSearchForLead(supabase, leadId, { requestSource });
    if (out.skippedDuplicate) {
      res.status(400).json({
        success: false,
        error: 'facebook_search_already_attempted',
        message:
          'Facebook search from the leads list can only be run once per lead. Open the lead and run search from Online profiles, or edit the Facebook URL manually.',
      });
      return;
    }
    res.status(200).json({
      success: true,
      ...out,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadGoogleSearchFacebook:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
