import { google } from 'googleapis';
import { getGoogleOauthEnv } from './get-google-oauth-env';

export type TokenExchangeResult = {
  accessToken: string | null;
  refreshToken: string | null;
  expiryDate: number | null;
};

/**
 * Exchange authorization code for tokens.
 */
export const exchangeCodeForTokens = async (code: string): Promise<TokenExchangeResult> => {
  const env = getGoogleOauthEnv();
  const oauth2Client = new google.auth.OAuth2(env.clientId, env.clientSecret, env.redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? null,
    expiryDate: tokens.expiry_date ?? null,
  };
};
