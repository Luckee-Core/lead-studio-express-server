import { SupabaseClient } from '@supabase/supabase-js';
import { attachFacebookGoogleSearchAttemptedToLeads } from '../facebook-google-search';
import { attachLeadPlaywrightWebsiteUrlDiscoveryAttemptedToLeads } from '../lead-playwright-website-url-discovery';
import { attachWebsiteResearchAttemptedToLeads } from '../website-scrape-runs/attach-website-research-attempted-to-leads';

/**
 * Merges lead rows with flags for automated research (Facebook SERP, Playwright URL discovery, website crawl).
 */
export const attachLeadResearchAttemptFlagsToLeads = async <T extends { id: string }>(
  supabase: SupabaseClient,
  leads: T[]
): Promise<
  Array<
    T & {
      facebook_google_search_attempted: boolean;
      playwright_website_url_discovery_attempted: boolean;
      website_research_attempted: boolean;
    }
  >
> => {
  const withFacebook = await attachFacebookGoogleSearchAttemptedToLeads(supabase, leads);
  const withPlaywright = await attachLeadPlaywrightWebsiteUrlDiscoveryAttemptedToLeads(
    supabase,
    withFacebook
  );
  return attachWebsiteResearchAttemptedToLeads(supabase, withPlaywright);
};
