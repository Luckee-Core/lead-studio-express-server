import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createActiveLeadPlaywrightWebsiteUrlDiscovery,
  finalizeLeadPlaywrightWebsiteUrlDiscovery,
  getLatestLeadPlaywrightWebsiteUrlDiscoveryForLead,
} from '../../data/lead-playwright-website-url-discovery';
import { getLeadById } from '../../data/leads/get-by-id';
import { updateLead } from '../../data/leads/update';
import { getPrimaryWebsiteForLead } from '../../utils/leads/get-primary-website-for-lead';
import { discoverInternalUrlsFromPrimaryWebsite } from '../dynamic-scraper/discover-internal-urls-from-primary-website';
import { mergeWebsiteUrls } from '../lead-same-domain-url-discovery/merge-website-urls';

export type PlaywrightWebsiteUrlDiscoveryForLeadResult =
  | { ok: true; leadId: string; leadUpdated: boolean; linkCount: number; websiteUrls: string[] }
  | { ok: false; error: 'lead_not_found' | 'website_required' | 'already_attempted' };

/**
 * Playwright nav/footer URL discovery for one lead; merges into `website_urls` like same-domain discovery.
 * At most one run per lead (tracked in `lead_playwright_website_url_discovery`).
 */
export const runPlaywrightWebsiteUrlDiscoveryForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<PlaywrightWebsiteUrlDiscoveryForLeadResult> => {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    return { ok: false, error: 'lead_not_found' };
  }

  const primaryWebsite = getPrimaryWebsiteForLead(lead);
  if (!primaryWebsite) {
    return { ok: false, error: 'website_required' };
  }

  const priorRun = await getLatestLeadPlaywrightWebsiteUrlDiscoveryForLead(supabase, leadId);
  if (priorRun) {
    console.log(
      'ℹ️ runPlaywrightWebsiteUrlDiscoveryForLead: skipping — lead already used its one Playwright URL discovery',
      { leadId, runId: priorRun.id, status: priorRun.status }
    );
    return { ok: false, error: 'already_attempted' };
  }

  const run = await createActiveLeadPlaywrightWebsiteUrlDiscovery(supabase, leadId);

  try {
    console.log('🔍 runPlaywrightWebsiteUrlDiscoveryForLead: start', {
      leadId: lead.id,
      primaryWebsite,
      existingWebsiteUrlsCount: Array.isArray(lead.website_urls) ? lead.website_urls.length : 0,
    });

    const discovered = await discoverInternalUrlsFromPrimaryWebsite(primaryWebsite);
    const merged = mergeWebsiteUrls(lead.website_urls, discovered);
    const previousCount = Array.isArray(lead.website_urls) ? lead.website_urls.length : 0;
    const leadUpdated = merged.length !== previousCount;

    if (leadUpdated) {
      await updateLead(supabase, lead.id, { website_urls: merged });
      console.log('💾 runPlaywrightWebsiteUrlDiscoveryForLead: website_urls updated', {
        leadId: lead.id,
        previousCount,
        nextCount: merged.length,
      });
    } else {
      console.log('ℹ️ runPlaywrightWebsiteUrlDiscoveryForLead: no new URLs discovered', {
        leadId: lead.id,
        existingCount: previousCount,
        discoveredCount: discovered.length,
      });
    }

    await finalizeLeadPlaywrightWebsiteUrlDiscovery(supabase, run.id, 'succeeded', {
      payload: {
        linkCount: discovered.length,
        leadUpdated,
        previousWebsiteUrlsCount: previousCount,
        mergedCount: merged.length,
      },
    });

    return {
      ok: true,
      leadId: lead.id,
      leadUpdated,
      linkCount: discovered.length,
      websiteUrls: merged,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ runPlaywrightWebsiteUrlDiscoveryForLead:', error);
    await finalizeLeadPlaywrightWebsiteUrlDiscovery(supabase, run.id, 'failed', {
      errorMessage: message,
    });
    throw error;
  }
};
