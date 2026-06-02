/**
 * List email sending identities for the From picker (no env key names).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { EmailSendingIdentityPublic } from './types';

export const listEmailSendingIdentitiesForUi = async (
  supabase: SupabaseClient
): Promise<EmailSendingIdentityPublic[]> => {
  const { data, error } = await supabase
    .from('email_sending_identities')
    .select('id, label, from_email, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to list email sending identities: ${error.message}`);
  }

  return (data ?? []) as EmailSendingIdentityPublic[];
};
