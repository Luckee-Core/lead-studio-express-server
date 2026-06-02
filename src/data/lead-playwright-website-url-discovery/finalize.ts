import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunStatus } from '../../types/lead-research';

/**
 * Marks a Playwright website URL discovery run finished with payload or error.
 */
export const finalizeLeadPlaywrightWebsiteUrlDiscovery = async (
  supabase: SupabaseClient,
  runId: string,
  status: Exclude<LeadResearchRunStatus, 'active'>,
  input: { errorMessage?: string | null; payload?: Record<string, unknown> | null }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lead_playwright_website_url_discovery')
    .update({
      status,
      error_message: input.errorMessage ?? null,
      payload: input.payload ?? null,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', runId);
  if (error) {
    throw new Error(`finalize lead_playwright_website_url_discovery: ${error.message}`);
  }
};
