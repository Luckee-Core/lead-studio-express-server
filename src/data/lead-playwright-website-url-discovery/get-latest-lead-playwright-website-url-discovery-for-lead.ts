import { SupabaseClient } from '@supabase/supabase-js';

export type LatestLeadPlaywrightWebsiteUrlDiscoveryRow = {
  id: string;
  payload: Record<string, unknown> | null;
  status: string;
};

/**
 * Returns the most recent `lead_playwright_website_url_discovery` row for a lead (any status), if any.
 * Used to enforce a single automated attempt per lead.
 */
export const getLatestLeadPlaywrightWebsiteUrlDiscoveryForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LatestLeadPlaywrightWebsiteUrlDiscoveryRow | null> => {
  const { data, error } = await supabase
    .from('lead_playwright_website_url_discovery')
    .select('id, payload, status')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`getLatestLeadPlaywrightWebsiteUrlDiscoveryForLead: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id as string,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    status: String(row.status ?? ''),
  };
};
