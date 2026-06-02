/**
 * Fetch one email_sending_identities row by id (includes send_as_env_key for server use).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { EmailSendingIdentityRow } from './types';

export const getEmailSendingIdentityById = async (
  supabase: SupabaseClient,
  id: string
): Promise<EmailSendingIdentityRow | null> => {
  const { data, error } = await supabase
    .from('email_sending_identities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch email sending identity: ${error.message}`);
  }

  return data as EmailSendingIdentityRow;
};
