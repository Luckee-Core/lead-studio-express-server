/**
 * When Postgres/PostgREST reports a missing `user_id` on `knowledge_transcript_chat_requests`,
 * append the repair migration so operators know what to run (schema drift vs migration 122).
 */
export const appendKtChatRequestsUserIdMigrationHint = (detail: string): string => {
  const lower = detail.toLowerCase();
  if (lower.includes('knowledge_transcript_chat_requests') && lower.includes('user_id')) {
    return `${detail} — Apply mentorai-server/migrations/142_knowledge_transcript_chat_requests_user_id.sql on this database (e.g. Supabase SQL editor), then retry.`;
  }
  return detail;
};
