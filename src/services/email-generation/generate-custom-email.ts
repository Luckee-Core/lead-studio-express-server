/**
 * Retrieve custom email content from an existing lead_contact_email.
 * Returns subject, body, and fromName for sending (no new record created).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactEmailById } from '../../data/lead-contact-emails';
import { pickRandomSenderName } from '../../data/lead-contact-emails/sender-names';

export type GenerateCustomEmailResult = {
  leadContactEmailId: string;
  subject: string;
  body: Record<string, unknown>;
  fromName: string;
};

export const generateCustomEmail = async (
  supabase: SupabaseClient,
  leadContactEmailId: string
): Promise<GenerateCustomEmailResult> => {
  const email = await getLeadContactEmailById(supabase, leadContactEmailId);
  if (!email) {
    throw new Error(`Lead contact email not found: ${leadContactEmailId}`);
  }

  const fromName = pickRandomSenderName();

  return {
    leadContactEmailId: email.id,
    subject: email.subject,
    body: email.body as Record<string, unknown>,
    fromName,
  };
};
