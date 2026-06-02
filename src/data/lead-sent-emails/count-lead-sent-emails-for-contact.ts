/**
 * Count rows in lead_sent_emails for a lead contact (for sequence step / draft kind).
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns how many sends are recorded for the contact (includes rows without resolvable email body).
 *
 * @param supabase - Supabase client (RLS applies).
 * @param leadContactId - Lead contact id.
 */
export const countLeadSentEmailsForContact = async (
  supabase: SupabaseClient,
  leadContactId: string,
): Promise<number> => {
  const { count, error } = await supabase
    .from('lead_sent_emails')
    .select('*', { count: 'exact', head: true })
    .eq('lead_contact_id', leadContactId);

  if (error) {
    throw new Error(`Failed to count lead sent emails: ${error.message}`);
  }

  return count ?? 0;
};
