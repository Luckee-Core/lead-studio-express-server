import { SupabaseClient } from '@supabase/supabase-js';
import {
  isMissingLeadFacebookPostsResearchInfraError,
  LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT,
} from './is-missing-lead-facebook-posts-research-infra-error';

const TABLE = 'lead_facebook_posts_research';

export const hasActiveLeadFacebookPostsResearch = async (
  supabase: SupabaseClient
): Promise<boolean> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingLeadFacebookPostsResearchInfraError(error.message)) {
      console.warn(`⚠️ hasActive ${TABLE}: ${LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT}`);
      return false;
    }
    throw new Error(`hasActive ${TABLE}: ${error.message}`);
  }
  return !!data;
};
