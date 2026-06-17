import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadSentEmailColdEmailOfferingRow } from './create';

/**
 * Fetches all sent-email ↔ offering junction rows.
 */
export const getAllLeadSentEmailColdEmailOfferings = async (
  supabase: SupabaseClient,
): Promise<LeadSentEmailColdEmailOfferingRow[]> => {
  const { data, error } = await supabase
    .from('lead_sent_email_cold_email_offering')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch lead sent email offerings: ${error.message}`);
  }

  return (data ?? []) as LeadSentEmailColdEmailOfferingRow[];
};
