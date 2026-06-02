/**
 * Gmail API client using per-user OAuth refresh token (Luckee).
 */

import type { gmail_v1 } from 'googleapis';
import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserGmailOauthByUserId } from '../../../data/user-gmail-oauth';
import { decryptSecret, encryptSecret, getTokenEncryptionKeyBuffer } from '../../../utils/crypto';
import { getGoogleOauthEnv } from '../../google-oauth/get-google-oauth-env';
import { upsertUserGmailOauth } from '../../../data/user-gmail-oauth/upsert';

export type GmailOAuthClientResult = {
  gmail: gmail_v1.Gmail;
  fromEmail: string;
};

/**
 * Build Gmail client for a user who completed Gmail OAuth; refreshes access token as needed.
 */
export const getGmailClientForOAuthUser = async (
  supabase: SupabaseClient,
  userId: string
): Promise<GmailOAuthClientResult | null> => {
  const row = await getUserGmailOauthByUserId(supabase, userId);
  if (!row) {
    return null;
  }

  const key = getTokenEncryptionKeyBuffer();
  const refreshToken = decryptSecret(row.refresh_token_ciphertext, key);
  const env = getGoogleOauthEnv();
  const oauth2Client = new google.auth.OAuth2(env.clientId, env.clientSecret, env.redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  await oauth2Client.getAccessToken();

  const creds = oauth2Client.credentials;
  if (creds.access_token && creds.expiry_date) {
    const accessEnc = encryptSecret(creds.access_token, key);
    const expiresIso = new Date(creds.expiry_date).toISOString();
    try {
      await upsertUserGmailOauth(supabase, {
        userId,
        gmailEmail: row.gmail_email,
        refreshTokenCiphertext: row.refresh_token_ciphertext,
        accessTokenCiphertext: accessEnc,
        tokenExpiresAt: expiresIso,
      });
    } catch (e) {
      console.warn('⚠️ Could not cache access token:', e);
    }
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  return { gmail, fromEmail: row.gmail_email };
};
