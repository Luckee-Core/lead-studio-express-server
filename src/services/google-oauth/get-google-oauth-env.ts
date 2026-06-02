/**
 * Required env for Gmail OAuth (Luckee).
 */
export type GoogleOauthEnv = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  stateSecret: string;
  frontendOrigin: string;
};

export const getGoogleOauthEnv = (): GoogleOauthEnv => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  const stateSecret = process.env.GOOGLE_OAUTH_STATE_SECRET?.trim();
  const frontendOrigin = (
    process.env.GMAIL_OAUTH_FRONTEND_ORIGIN?.trim() || 'http://localhost:3000'
  ).replace(/\/$/, '');

  if (!clientId || !clientSecret || !redirectUri || !stateSecret) {
    throw new Error(
      'Missing Gmail OAuth env: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI, GOOGLE_OAUTH_STATE_SECRET'
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    stateSecret,
    frontendOrigin,
  };
};

export const GMAIL_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
