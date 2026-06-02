import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunRow } from '../../types/lead-research';

/**
 * Inserts an active row for a Playwright website URL discovery run.
 */
export const createActiveLeadPlaywrightWebsiteUrlDiscovery = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadResearchRunRow> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lead_playwright_website_url_discovery')
    .insert({
      lead_id: leadId,
      status: 'active',
      started_at: now,
    })
    .select()
    .single();
  if (error) {
    throw new Error(`createActive lead_playwright_website_url_discovery: ${error.message}`);
  }
  return data as LeadResearchRunRow;
};
