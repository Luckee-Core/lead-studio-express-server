import { SupabaseClient } from '@supabase/supabase-js';
import { getLatestSucceededFacebookPageResearchByLeadId } from '../lead-facebook-page-research/get-latest-succeeded-by-lead-id';
import { getLatestSucceededFacebookPostsResearchByLeadId } from '../lead-facebook-posts-research/get-latest-succeeded-by-lead-id';
import type { FacebookPageResearchRow } from '../lead-facebook-page-research/get-latest-succeeded-by-lead-id';
import type { FacebookPostsResearchRow } from '../lead-facebook-posts-research/get-latest-succeeded-by-lead-id';

export type FacebookResearchForLead = {
  page: FacebookPageResearchRow | null;
  posts: FacebookPostsResearchRow | null;
};

/**
 * Loads latest succeeded Facebook page + posts research rows for a lead.
 */
export const getFacebookResearchForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<FacebookResearchForLead> => {
  const [page, posts] = await Promise.all([
    getLatestSucceededFacebookPageResearchByLeadId(supabase, leadId),
    getLatestSucceededFacebookPostsResearchByLeadId(supabase, leadId),
  ]);
  return { page, posts };
};
