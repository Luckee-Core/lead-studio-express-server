import { SupabaseClient } from '@supabase/supabase-js';
import {
  isMissingLeadFacebookPostsResearchInfraError,
  LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT,
} from './is-missing-lead-facebook-posts-research-infra-error';

/**
 * Replaces `payload` on an existing `lead_facebook_posts_research` row (e.g. score-only merge).
 */
export const updateLeadFacebookPostsResearchPayloadById = async (
  supabase: SupabaseClient,
  rowId: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lead_facebook_posts_research')
    .update({ payload, updated_at: now })
    .eq('id', rowId);
  if (error) {
    if (isMissingLeadFacebookPostsResearchInfraError(error.message)) {
      throw new Error(
        `update facebook posts research payload: Database table missing. ${LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT} (PostgREST: ${error.message})`
      );
    }
    throw new Error(`update facebook posts research payload: ${error.message}`);
  }
};
