import { google } from 'googleapis';
import type { GmailOauthStatePayload } from './sign-oauth-state';
import { signGmailOauthState } from './sign-oauth-state';
import { GMAIL_OAUTH_SCOPES, getGoogleOauthEnv } from './get-google-oauth-env';

type BuildParams = {
  userId: string;
  returnPath: string;
};

const STATE_TTL_SEC = 600;

const sanitizeReturnPath = (path: string): string => {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/settings/email-connections';
  }
  return path.split('?')[0].slice(0, 512);
};

/**
 * Build Google OAuth consent URL for Gmail send scope.
 */
export const buildGmailAuthorizationUrl = (params: BuildParams): string => {
  const env = getGoogleOauthEnv();
  const returnPath = sanitizeReturnPath(params.returnPath);

  const payload: GmailOauthStatePayload = {
    userId: params.userId,
    exp: Math.floor(Date.now() / 1000) + STATE_TTL_SEC,
    returnPath,
  };
  const state = signGmailOauthState(payload, env.stateSecret);

  const oauth2Client = new google.auth.OAuth2(env.clientId, env.clientSecret, env.redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_OAUTH_SCOPES,
    state,
    include_granted_scopes: true,
  });
};
