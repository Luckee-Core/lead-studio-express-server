import { createManagedSupabaseClient } from '../../../services/supabase/create-supabase-client';
import {
  exchangeCodeForTokens,
  fetchGoogleAccountEmail,
  getGoogleOauthEnv,
  verifyGmailOauthState,
} from '../../../services/google-oauth';
import { encryptSecret, getTokenEncryptionKeyBuffer } from '../../../utils/crypto';
import { upsertUserGmailOauth } from '../../../data/user-gmail-oauth';

export type GmailCallbackResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; redirectUrl: string };

/**
 * Complete Gmail OAuth: verify state, exchange code, persist encrypted tokens, return frontend redirect.
 */
export const processGmailOauthCallback = async (params: {
  code: string | undefined;
  state: string | undefined;
  error?: string | undefined;
}): Promise<GmailCallbackResult> => {
  const env = getGoogleOauthEnv();

  const fail = (reason: string): GmailCallbackResult => {
    const q = new URLSearchParams({ gmail_error: reason });
    return {
      ok: false,
      redirectUrl: `${env.frontendOrigin}/settings/email-connections?${q.toString()}`,
    };
  };

  if (params.error) {
    return fail(params.error);
  }

  const code = params.code;
  const state = params.state;
  if (!code || !state) {
    return fail('missing_code_or_state');
  }

  const payload = verifyGmailOauthState(state, env.stateSecret);
  if (!payload) {
    return fail('invalid_state');
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error('❌ Gmail token exchange:', e);
    return fail('token_exchange_failed');
  }

  if (!tokens.refreshToken) {
    return fail('missing_refresh_token');
  }

  let gmailEmail: string;
  try {
    if (!tokens.accessToken) {
      return fail('missing_access_token');
    }
    gmailEmail = await fetchGoogleAccountEmail(tokens.accessToken);
  } catch (e) {
    console.error('❌ Gmail userinfo:', e);
    return fail('userinfo_failed');
  }

  const supabase = createManagedSupabaseClient();
  const key = getTokenEncryptionKeyBuffer();
  const refreshEnc = encryptSecret(tokens.refreshToken, key);
  const accessEnc = tokens.accessToken ? encryptSecret(tokens.accessToken, key) : null;
  const tokenExpiresAt = tokens.expiryDate
    ? new Date(tokens.expiryDate).toISOString()
    : null;

  try {
    await upsertUserGmailOauth(supabase, {
      userId: payload.userId,
      gmailEmail,
      refreshTokenCiphertext: refreshEnc,
      accessTokenCiphertext: accessEnc,
      tokenExpiresAt,
    });
  } catch (e) {
    console.error('❌ Gmail oauth upsert:', e);
    return fail('save_failed');
  }

  const sep = payload.returnPath.includes('?') ? '&' : '?';
  const redirectUrl = `${env.frontendOrigin}${payload.returnPath}${sep}gmail_connected=1`;
  return { ok: true, redirectUrl };
};
