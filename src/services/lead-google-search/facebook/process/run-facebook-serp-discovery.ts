import { getLeadById } from '../../../../data/leads/get-by-id';
import {
  buildFacebookGoogleSearchQuery,
  processGoogleSerpScrape,
  type SerpLink,
} from '../../../../domains/google-search/processGoogleSerpScrape';
import { parseAddressForSerp } from '../../../../utils/lead-research/parse-address-for-serp';
import { getPrimaryWebsiteForLead } from '../../../../utils/leads/get-primary-website-for-lead';
import { urlLooksLikeFacebookProfileOrPage } from '../../../../utils/url/facebook-serp-url';
import { extractHostnameFromWebsiteInput } from '../../../../utils/url/extract-hostname-from-website-input';
import type { FacebookSerpDiscoveryInput, FacebookSerpDiscoveryResult } from '../types';

const serpHasFacebookProfileCandidate = (links: SerpLink[]): boolean =>
  links.some((l) => urlLooksLikeFacebookProfileOrPage(l.url));

const mergeSerpLinksDedupe = (primary: SerpLink[], secondary: SerpLink[]): SerpLink[] => {
  const seen = new Set<string>();
  const out: SerpLink[] = [];
  for (const row of [...primary, ...secondary]) {
    const u = row.url?.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(row);
  }
  return out.slice(0, 40);
};

/**
 * Discovery phase for Facebook profile search:
 * 1) Load lead context
 * 2) Build best-available query (name/location + optional website)
 * 3) Scrape SERP candidate links; optional `site:facebook.com` fallback when organic has no Page URLs
 *
 * When `lead.address` is empty, city/state are omitted from the query instead of using env defaults
 * (defaults were biasing SERP toward the wrong metro, e.g. Philadelphia).
 */
export const runFacebookSerpDiscovery = async (
  input: FacebookSerpDiscoveryInput
): Promise<FacebookSerpDiscoveryResult> => {
  const { supabase, leadId } = input;
  const lead = await getLeadById(supabase, leadId);

  if (!lead) {
    throw new Error('Lead missing after claim');
  }

  const primaryWebsite = getPrimaryWebsiteForLead(lead);
  const knownHost = primaryWebsite ? extractHostnameFromWebsiteInput(primaryWebsite) : null;
  const parsedGeo = parseAddressForSerp(lead.address);
  const hasLeadAddress = Boolean((lead.address ?? '').trim());
  const city = hasLeadAddress ? parsedGeo.city : '';
  const state = hasLeadAddress ? parsedGeo.state : '';
  const platform = 'facebook' as const;

  const searchBusinessName = primaryWebsite
    ? lead.business_name
    : `${lead.business_name} facebook page`;

  const serpQuery = primaryWebsite
    ? buildFacebookGoogleSearchQuery({
        businessName: lead.business_name,
        city,
        state,
        websiteUrl: primaryWebsite,
      })
    : [searchBusinessName, city, state].filter(Boolean).join(' ');

  let serpLinks = await processGoogleSerpScrape({
    businessName: searchBusinessName,
    city,
    state,
    websiteUrlForSocialQuery: primaryWebsite,
    socialProfilesPlatform: platform,
  });

  const businessNameTrim = (lead.business_name ?? '').trim();
  if (!serpHasFacebookProfileCandidate(serpLinks) && businessNameTrim) {
    const geo = [city, state].filter(Boolean).join(' ').trim();
    const fallbackQuery = ['site:facebook.com', businessNameTrim, geo].filter(Boolean).join(' ').trim();
    console.log('🔍 lead-google-search/facebook: no Facebook URLs in first SERP; fallback query', {
      leadId: lead.id,
      fallbackQuery,
    });
    const fallbackLinks = await processGoogleSerpScrape({
      businessName: businessNameTrim,
      city,
      state,
      queryOverride: fallbackQuery,
      socialProfilesPlatform: platform,
    });
    serpLinks = mergeSerpLinksDedupe(serpLinks, fallbackLinks);
  }

  return {
    lead,
    platform,
    city,
    state,
    primaryWebsite,
    knownHost,
    serpQuery,
    serpLinks,
  };
};
