import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getManualLeadIdFromBody, verifyCronSecret } from '../lead-research-shared';
import { runPlaywrightWebsiteUrlDiscoveryForLead } from './run-playwright-website-url-discovery-for-lead';

export { runPlaywrightWebsiteUrlDiscoveryForLead } from './run-playwright-website-url-discovery-for-lead';

/**
 * POST /api/services/lead-playwright-website-url-discovery — manual only.
 *
 * Body must include `leadId`. Uses Playwright on the lead primary website to discover internal URLs.
 */
export const runLeadPlaywrightWebsiteUrlDiscovery = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const leadId = getManualLeadIdFromBody(req);
  if (!leadId) {
    res.status(400).json({ success: false, error: 'leadId_required', message: 'Provide leadId' });
    return;
  }

  const supabase = getSupabaseClient();

  try {
    const result = await runPlaywrightWebsiteUrlDiscoveryForLead(supabase, leadId);
    if (!result.ok) {
      if (result.error === 'lead_not_found') {
        res.status(404).json({ success: false, error: 'lead_not_found' });
        return;
      }
      if (result.error === 'already_attempted') {
        res.status(400).json({
          success: false,
          error: 'playwright_website_url_discovery_already_attempted',
          message:
            'Site page URL discovery can only be run once per lead. Edit same-domain URLs on the lead manually if needed.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'website_required',
        message: 'Add a website on this lead before discovering site page URLs.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      leadId: result.leadId,
      leadUpdated: result.leadUpdated,
      linkCount: result.linkCount,
      websiteUrls: result.websiteUrls,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadPlaywrightWebsiteUrlDiscovery:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
