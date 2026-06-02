import crypto from 'crypto';

export type GmailOauthStatePayload = {
  userId: string;
  exp: number;
  returnPath: string;
};

/**
 * Sign OAuth state (HMAC) to bind callback to user and optional return path.
 */
export const signGmailOauthState = (payload: GmailOauthStatePayload, secret: string): string => {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
};

/**
 * Verify and parse OAuth state; returns null if invalid or expired.
 */
export const verifyGmailOauthState = (state: string, secret: string): GmailOauthStatePayload | null => {
  const dot = state.lastIndexOf('.');
  if (dot <= 0) {
    return null;
  }
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as GmailOauthStatePayload;
    if (!parsed.userId || typeof parsed.exp !== 'number' || typeof parsed.returnPath !== 'string') {
      return null;
    }
    if (Date.now() / 1000 > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
