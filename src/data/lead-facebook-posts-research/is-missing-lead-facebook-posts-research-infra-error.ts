/**
 * PostgREST / Supabase errors when `lead_facebook_posts_research` or its RPC is not in the project
 * (migration not applied).
 */
export const LEAD_FACEBOOK_POSTS_RESEARCH_MIGRATION_HINT =
  'Apply migrations/057_create_lead_facebook_posts_research.sql in the Supabase SQL editor (or your migration runner), then reload the schema cache if needed.';

/**
 * Returns true when the error indicates the posts-research table or queue RPC is missing.
 */
export const isMissingLeadFacebookPostsResearchInfraError = (message: string): boolean => {
  const m = message.toLowerCase();
  const mentionsTable = m.includes('lead_facebook_posts_research');
  const mentionsRpc = m.includes('next_lead_id_for_facebook_posts_research');
  if (!mentionsTable && !mentionsRpc) return false;
  return (
    m.includes('schema cache') ||
    m.includes('does not exist') ||
    m.includes('could not find') ||
    (m.includes('function') && m.includes('does not exist')) ||
    (m.includes('relation') && m.includes('does not exist'))
  );
};
