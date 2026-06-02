import { google } from 'googleapis';
import { getGoogleOauthEnv } from './get-google-oauth-env';

/**
 * Resolve the Gmail / Google account email for OAuth credentials.
 */
export const fetchGoogleAccountEmail = async (accessToken: string): Promise<string> => {
  const env = getGoogleOauthEnv();
  const oauth2Client = new google.auth.OAuth2(env.clientId, env.clientSecret, env.redirectUri);
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  const email = data.email;
  if (!email) {
    throw new Error('Google account has no email (userinfo)');
  }
  return email;
};
