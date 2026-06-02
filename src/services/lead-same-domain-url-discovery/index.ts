import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getManualLeadIdFromBody, verifyCronSecret } from '../lead-research-shared';
import { runSameDomainUrlDiscoveryForLead } from './run-same-domain-url-discovery-for-lead';

export { runSameDomainUrlDiscoveryForLead } from './run-same-domain-url-discovery-for-lead';

/**
 * POST /api/services/lead-same-domain-url-discovery — manual only.
 *
 * Body must include `leadId`.
 */
export const runLeadSameDomainUrlDiscovery = async (
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
    const result = await runSameDomainUrlDiscoveryForLead(supabase, leadId);
    if (!result.ok) {
      if (result.error === 'lead_not_found') {
        res.status(404).json({ success: false, error: 'lead_not_found' });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'website_required',
        message: 'Add a website on this lead before discovering same-domain URLs.',
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
    console.error('❌ runLeadSameDomainUrlDiscovery:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
