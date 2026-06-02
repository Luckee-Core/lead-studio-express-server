import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunRow } from '../../types/lead-research';
import {
  isMissingLeadFacebookPostsResearchInfraError,
  LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT,
} from './is-missing-lead-facebook-posts-research-infra-error';

export const createActiveLeadFacebookPostsResearch = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadResearchRunRow> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lead_facebook_posts_research')
    .insert({
      lead_id: leadId,
      status: 'active',
      started_at: now,
    })
    .select()
    .single();
  if (error) {
    if (isMissingLeadFacebookPostsResearchInfraError(error.message)) {
      throw new Error(
        `createActive facebook posts research: Database table missing. ${LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT} (PostgREST: ${error.message})`
      );
    }
    throw new Error(`createActive facebook posts research: ${error.message}`);
  }
  return data as LeadResearchRunRow;
};
