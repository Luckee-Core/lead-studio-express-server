/**
 * AES-256-GCM encrypt/decrypt for OAuth token storage.
 * Key: GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY — 32 bytes as 64-char hex or base64.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

/**
 * Parse encryption key from environment.
 */
export const getTokenEncryptionKeyBuffer = (): Buffer => {
  const raw = process.env.GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!raw || !raw.trim()) {
    throw new Error('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY is not set (32-byte key as hex or base64)');
  }
  const trimmed = raw.trim();
  let key: Buffer;
  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    key = Buffer.from(trimmed, 'hex');
  } else {
    key = Buffer.from(trimmed, 'base64');
  }
  if (key.length !== KEY_LENGTH) {
    throw new Error('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
};

/**
 * Encrypt plaintext; returns dot-separated base64url parts: iv.tag.ciphertext
 */
export const encryptSecret = (plainText: string, key: Buffer): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
};

/**
 * Decrypt payload from encryptSecret.
 */
export const decryptSecret = (payload: string, key: Buffer): string => {
  const parts = payload.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const ciphertext = Buffer.from(ctB64, 'base64url');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
};
