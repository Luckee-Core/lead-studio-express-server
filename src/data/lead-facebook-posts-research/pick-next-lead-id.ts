import { SupabaseClient } from '@supabase/supabase-js';
import {
  isMissingLeadFacebookPostsResearchInfraError,
  LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT,
} from './is-missing-lead-facebook-posts-research-infra-error';

export const pickNextLeadIdForFacebookPostsResearch = async (
  supabase: SupabaseClient
): Promise<string | null> => {
  const { data, error } = await supabase.rpc('next_lead_id_for_facebook_posts_research');
  if (error) {
    if (isMissingLeadFacebookPostsResearchInfraError(error.message)) {
      console.warn(`⚠️ pickNextLead facebook posts research: ${LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT}`);
      return null;
    }
    throw new Error(`pickNextLead facebook posts research: ${error.message}`);
  }
  return data as string | null;
};
