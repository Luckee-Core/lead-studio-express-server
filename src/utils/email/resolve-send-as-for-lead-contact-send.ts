/**
 * Resolve Gmail impersonation address for a lead email send: identity row + env, or GMAIL_SEND_AS_EMAIL.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getEmailSendingIdentityById } from '../../data/email-sending-identities';

export type ResolvedSendAsForLeadContact = {
  sendAsEmail: string;
  emailSendingIdentityId: string | null;
};

/**
 * @param emailSendingIdentityId - Draft's email_sending_identity_id; null/undefined uses GMAIL_SEND_AS_EMAIL only.
 */
export const resolveSendAsForLeadContactSend = async (
  supabase: SupabaseClient,
  emailSendingIdentityId: string | null | undefined
): Promise<ResolvedSendAsForLeadContact> => {
  const id = emailSendingIdentityId?.trim() || null;
  if (!id) {
    const sendAsEmail = process.env.GMAIL_SEND_AS_EMAIL?.trim();
    if (!sendAsEmail) {
      throw new Error(
        'Set GMAIL_SEND_AS_EMAIL on the server, or select a From address linked to an env var (email_sending_identities).'
      );
    }
    return { sendAsEmail, emailSendingIdentityId: null };
  }

  const row = await getEmailSendingIdentityById(supabase, id);
  if (!row) {
    throw new Error('Unknown email sending identity.');
  }

  const key = row.send_as_env_key?.trim();
  if (!key) {
    throw new Error('Email sending identity is missing send_as_env_key.');
  }

  const sendAsEmail = process.env[key]?.trim();
  if (!sendAsEmail) {
    throw new Error(
      `Set environment variable ${key} to the Google Workspace address for "${row.label}" (expected ${row.from_email}).`
    );
  }

  if (sendAsEmail.toLowerCase() !== row.from_email.trim().toLowerCase()) {
    console.warn(
      `⚠️ ${key}=${sendAsEmail} differs from identity from_email ${row.from_email}; using env value for Gmail send.`
    );
  }

  return { sendAsEmail, emailSendingIdentityId: id };
};
