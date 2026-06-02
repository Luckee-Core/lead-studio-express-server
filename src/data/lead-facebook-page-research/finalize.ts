import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunStatus } from '../../types/lead-research';

export const finalizeLeadFacebookPageResearch = async (
  supabase: SupabaseClient,
  runId: string,
  status: Exclude<LeadResearchRunStatus, 'active'>,
  input: { errorMessage?: string | null; payload?: Record<string, unknown> | null }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lead_facebook_page_research')
    .update({
      status,
      error_message: input.errorMessage ?? null,
      payload: input.payload ?? null,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', runId);
  if (error) throw new Error(`finalize facebook page research: ${error.message}`);
};
