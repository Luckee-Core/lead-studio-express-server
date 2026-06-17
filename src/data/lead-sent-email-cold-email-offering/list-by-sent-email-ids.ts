import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadSentEmailColdEmailOfferingRow } from './create';

/**
 * Fetch junction rows for a set of sent email ids.
 */
export const listLeadSentEmailColdEmailOfferingsBySentEmailIds = async (
  supabase: SupabaseClient,
  sentEmailIds: string[],
): Promise<LeadSentEmailColdEmailOfferingRow[]> => {
  if (sentEmailIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('lead_sent_email_cold_email_offering')
    .select('*')
    .in('lead_sent_email_id', sentEmailIds);

  if (error) {
    console.error('❌ listLeadSentEmailColdEmailOfferingsBySentEmailIds:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as LeadSentEmailColdEmailOfferingRow[];
};
