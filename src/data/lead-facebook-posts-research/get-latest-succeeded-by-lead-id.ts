import { SupabaseClient } from '@supabase/supabase-js';
import {
  isMissingLeadFacebookPostsResearchInfraError,
  LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT,
} from './is-missing-lead-facebook-posts-research-infra-error';

export type FacebookPostsResearchRow = {
  id: string;
  payload: unknown;
  completed_at: string | null;
};

/**
 * Latest succeeded Facebook posts scrape run for a lead (for UI).
 */
export const getLatestSucceededFacebookPostsResearchByLeadId = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<FacebookPostsResearchRow | null> => {
  const { data, error } = await supabase
    .from('lead_facebook_posts_research')
    .select('id, payload, completed_at')
    .eq('lead_id', leadId)
    .eq('status', 'succeeded')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingLeadFacebookPostsResearchInfraError(error.message)) {
      console.warn(
        `⚠️ getLatestSucceededFacebookPostsResearchByLeadId: ${LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT}`
      );
      return null;
    }
    throw new Error(`getLatestSucceededFacebookPostsResearchByLeadId: ${error.message}`);
  }

  return data as FacebookPostsResearchRow | null;
};
