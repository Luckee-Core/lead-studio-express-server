import { SupabaseClient } from '@supabase/supabase-js';

export type LeadSentEmailColdEmailOfferingRow = {
  lead_sent_email_id: string;
  cold_email_offering_id: string;
  created_at: string;
};

/**
 * Link a sent email to the cold email offering used at send time.
 */
export const createLeadSentEmailColdEmailOffering = async (
  supabase: SupabaseClient,
  input: { leadSentEmailId: string; coldEmailOfferingId: string },
): Promise<LeadSentEmailColdEmailOfferingRow> => {
  const { data, error } = await supabase
    .from('lead_sent_email_cold_email_offering')
    .insert({
      lead_sent_email_id: input.leadSentEmailId,
      cold_email_offering_id: input.coldEmailOfferingId,
    })
    .select('*')
    .single();

  if (error) {
    console.error('❌ createLeadSentEmailColdEmailOffering:', error);
    throw new Error(error.message);
  }

  return data as LeadSentEmailColdEmailOfferingRow;
};
