import type { Lead } from '../../data/leads/get-all';
import type { UpdateLeadInput } from '../../data/leads/update';

/**
 * Fills empty lead email slots from a Facebook scrape without overwriting existing values.
 */
export const buildLeadEmailUpdatesFromFacebookScrape = (
  lead: Lead,
  scrapedEmail: string
): UpdateLeadInput | null => {
  const updates: UpdateLeadInput = {};
  if (!lead.business_email?.trim()) {
    updates.business_email = scrapedEmail;
  }
  if (!lead.email?.trim()) {
    updates.email = scrapedEmail;
  }
  if (Object.keys(updates).length === 0) {
    return null;
  }
  return updates;
};
