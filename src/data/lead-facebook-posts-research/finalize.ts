import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunStatus } from '../../types/lead-research';
import {
  isMissingLeadFacebookPostsResearchInfraError,
  LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT,
} from './is-missing-lead-facebook-posts-research-infra-error';

export const finalizeLeadFacebookPostsResearch = async (
  supabase: SupabaseClient,
  runId: string,
  status: Exclude<LeadResearchRunStatus, 'active'>,
  input: { errorMessage?: string | null; payload?: Record<string, unknown> | null }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lead_facebook_posts_research')
    .update({
      status,
      error_message: input.errorMessage ?? null,
      payload: input.payload ?? null,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', runId);
  if (error) {
    if (isMissingLeadFacebookPostsResearchInfraError(error.message)) {
      throw new Error(
        `finalize facebook posts research: Database table missing. ${LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT} (PostgREST: ${error.message})`
      );
    }
    throw new Error(`finalize facebook posts research: ${error.message}`);
  }
};
