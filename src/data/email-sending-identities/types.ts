/**
 * Row shape for public.email_sending_identities (server).
 */
export type EmailSendingIdentityRow = {
  id: string;
  label: string;
  from_email: string;
  send_as_env_key: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Fields exposed to the dashboard for From picker (no env key names).
 */
export type EmailSendingIdentityPublic = {
  id: string;
  label: string;
  from_email: string;
  sort_order: number;
};
