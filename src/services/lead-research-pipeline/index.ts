import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import { buildGoogleWebSearchQuery, processGoogleSerpScrape } from '../../domains/google-search/processGoogleSerpScrape';
import { verifyCronSecret } from '../lead-research-shared';
import { runSameDomainUrlDiscoveryForLead } from '../lead-same-domain-url-discovery';
import { processFacebookGoogleSearchForLead } from '../lead-google-search/facebook/process-facebook-google-search-for-lead';
import { parseAddressForSerp } from '../../utils/lead-research/parse-address-for-serp';
import { getPrimaryWebsiteForLead } from '../../utils/leads/get-primary-website-for-lead';
import { extractHostnameFromWebsiteInput } from '../../utils/url/extract-hostname-from-website-input';

export type LeadResearchPipelineItemResult = {
  leadId: string;
  ok: boolean;
  error?: string;
  phase?: string;
};

/**
 * Generic web SERP (Apify) for one lead — same query rules as Phase A after same-domain; does not run same-domain.
 */
export const runWebSerpDiscoveryForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<void> => {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    throw new Error('lead_not_found');
  }

  const primaryWebsite = getPrimaryWebsiteForLead(lead);
  const { city, state } = parseAddressForSerp(lead.address);
  const businessName = lead.business_name?.trim() || lead.name?.trim() || '';

  const baseInput = {
    businessName: businessName || ' ',
    city,
    state,
  };
  const baseQuery = buildGoogleWebSearchQuery(baseInput);
  const host = primaryWebsite ? extractHostnameFromWebsiteInput(primaryWebsite) : '';

  await processGoogleSerpScrape({
    ...baseInput,
    queryOverride:
      primaryWebsite && host
        ? [baseQuery, host].filter((p) => String(p).trim().length > 0).join(' ')
        : undefined,
  });
};

/**
 * Phase A: same-domain discovery when website exists; then generic web SERP (Apify).
 */
const runPhaseAWebDiscovery = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<void> => {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    throw new Error('lead_not_found');
  }

  const primaryWebsite = getPrimaryWebsiteForLead(lead);

  if (primaryWebsite) {
    const sameDomain = await runSameDomainUrlDiscoveryForLead(supabase, leadId);
    if (!sameDomain.ok && sameDomain.error === 'lead_not_found') {
      throw new Error('lead_not_found');
    }
  }

  await runWebSerpDiscoveryForLead(supabase, leadId);
};

const parseLeadIdsFromBody = (req: Request): string[] | null => {
  const body = req.body;
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { leadIds?: unknown }).leadIds;
  if (!Array.isArray(raw)) return null;
  const ids = raw
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return ids.length > 0 ? ids : null;
};

/**
 * POST /api/services/lead-research-pipeline
 * Body: `{ leadIds: string[] }` — sequential per lead: web discovery (phase A) then Facebook Google search (phase B).
 */
export const runLeadResearchPipeline = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const leadIds = parseLeadIdsFromBody(req);
  if (!leadIds) {
    res.status(400).json({
      success: false,
      error: 'leadIds_required',
      message: 'Provide leadIds: string[]',
    });
    return;
  }

  const supabase = getSupabaseClient();
  const results: LeadResearchPipelineItemResult[] = [];

  for (const leadId of leadIds) {
    try {
      await runPhaseAWebDiscovery(supabase, leadId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        leadId,
        ok: false,
        error: msg,
        phase: 'web_discovery',
      });
      continue;
    }

    try {
      await processFacebookGoogleSearchForLead(supabase, leadId);
      results.push({ leadId, ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        leadId,
        ok: false,
        error: msg,
        phase: 'facebook_google_search',
      });
    }
  }

  const allOk = results.every((r) => r.ok);
  res.status(200).json({
    success: allOk,
    results,
  });
};
