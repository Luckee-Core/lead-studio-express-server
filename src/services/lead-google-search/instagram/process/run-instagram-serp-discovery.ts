import { getLeadById } from '../../../../data/leads/get-by-id';
import {
  buildInstagramGoogleSearchQuery,
  processGoogleSerpScrape,
} from '../../../../domains/google-search/processGoogleSerpScrape';
import { parseAddressForSerp } from '../../../../utils/lead-research/parse-address-for-serp';
import { getPrimaryWebsiteForLead } from '../../../../utils/leads/get-primary-website-for-lead';
import { extractHostnameFromWebsiteInput } from '../../../../utils/url/extract-hostname-from-website-input';
import type { InstagramSerpDiscoveryInput, InstagramSerpDiscoveryResult } from '../types';

/**
 * Discovery phase for Instagram profile search:
 * 1) Load lead context
 * 2) Build best-available query (name/location + optional website)
 * 3) Scrape SERP candidate links
 */
export const runInstagramSerpDiscovery = async (
  input: InstagramSerpDiscoveryInput
): Promise<InstagramSerpDiscoveryResult> => {
  const { supabase, leadId } = input;
  const lead = await getLeadById(supabase, leadId);

  if (!lead) {
    throw new Error('Lead missing after claim');
  }

  const primaryWebsite = getPrimaryWebsiteForLead(lead);
  const knownHost = primaryWebsite ? extractHostnameFromWebsiteInput(primaryWebsite) : null;
  const { city, state } = parseAddressForSerp(lead.address);
  const platform = 'instagram' as const;

  const searchBusinessName = primaryWebsite
    ? lead.business_name
    : `${lead.business_name} instagram profile`;

  const serpQuery = primaryWebsite
    ? buildInstagramGoogleSearchQuery({
        businessName: lead.business_name,
        city,
        state,
        websiteUrl: primaryWebsite,
      })
    : [searchBusinessName, city, state].filter(Boolean).join(' ');

  const serpLinks = await processGoogleSerpScrape({
    businessName: searchBusinessName,
    city,
    state,
    websiteUrlForSocialQuery: primaryWebsite,
    socialProfilesPlatform: platform,
  });

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
