import type { Lead } from '../../data/leads/get-all';
import type { UpdateLeadInput } from '../../data/leads/update';

/**
 * Fills empty lead phone slots from a Facebook scrape without overwriting existing values.
 */
export const buildLeadPhoneUpdatesFromFacebookScrape = (
  lead: Lead,
  scrapedPhone: string
): UpdateLeadInput | null => {
  const updates: UpdateLeadInput = {};
  if (!lead.business_phone?.trim()) {
    updates.business_phone = scrapedPhone;
  }
  if (!lead.phone?.trim()) {
    updates.phone = scrapedPhone;
  }
  if (Object.keys(updates).length === 0) {
    return null;
  }
  return updates;
};
