/**
 * Row shape for user_gmail_oauth (tokens stored ciphertext — never log).
 */
export type UserGmailOauthRow = {
  user_id: string;
  gmail_email: string;
  refresh_token_ciphertext: string;
  access_token_ciphertext: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertUserGmailOauthInput = {
  userId: string;
  gmailEmail: string;
  refreshTokenCiphertext: string;
  accessTokenCiphertext: string | null;
  tokenExpiresAt: string | null;
};
