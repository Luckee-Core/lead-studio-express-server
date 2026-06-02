import { buildGmailAuthorizationUrl } from '../../../services/google-oauth';

/**
 * Start Gmail OAuth: return Google authorization URL.
 */
export const processStartGmailOauth = (input: { userId: string; returnPath?: string }): { authUrl: string } => {
  const path = input.returnPath && input.returnPath.trim() ? input.returnPath.trim() : '/settings/email-connections';
  const authUrl = buildGmailAuthorizationUrl({
    userId: input.userId,
    returnPath: path,
  });
  return { authUrl };
};
