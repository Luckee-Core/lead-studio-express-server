import type { SupabaseClient } from '@supabase/supabase-js';
import { getLeadById } from '../../data/leads/get-by-id';
import { updateLead } from '../../data/leads/update';
import { getPrimaryWebsiteForLead } from '../../utils/leads/get-primary-website-for-lead';
import { discoverSameDomainUrls } from '../../utils/website/discover-same-domain-urls';
import { mergeWebsiteUrls } from './merge-website-urls';

export type SameDomainUrlDiscoveryForLeadResult =
  | { ok: true; leadId: string; leadUpdated: boolean; linkCount: number; websiteUrls: string[] }
  | { ok: false; error: 'lead_not_found' | 'website_required' };

/**
 * Same-domain URL discovery for one lead (shared by HTTP route and research pipeline).
 */
export const runSameDomainUrlDiscoveryForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<SameDomainUrlDiscoveryForLeadResult> => {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    return { ok: false, error: 'lead_not_found' };
  }

  const primaryWebsite = getPrimaryWebsiteForLead(lead);
  if (!primaryWebsite) {
    return { ok: false, error: 'website_required' };
  }

  console.log('🔍 runSameDomainUrlDiscoveryForLead: start', {
    leadId: lead.id,
    primaryWebsite,
    existingWebsiteUrlsCount: Array.isArray(lead.website_urls) ? lead.website_urls.length : 0,
  });

  const discovered = await discoverSameDomainUrls(primaryWebsite);
  const merged = mergeWebsiteUrls(lead.website_urls, discovered);
  const previousCount = Array.isArray(lead.website_urls) ? lead.website_urls.length : 0;
  const leadUpdated = merged.length !== previousCount;

  if (leadUpdated) {
    await updateLead(supabase, lead.id, { website_urls: merged });
    console.log('💾 runSameDomainUrlDiscoveryForLead: website_urls updated', {
      leadId: lead.id,
      previousCount,
      nextCount: merged.length,
    });
  } else {
    console.log('ℹ️ runSameDomainUrlDiscoveryForLead: no new URLs discovered', {
      leadId: lead.id,
      existingCount: previousCount,
    });
  }

  return {
    ok: true,
    leadId: lead.id,
    leadUpdated,
    linkCount: discovered.length,
    websiteUrls: merged,
  };
};
