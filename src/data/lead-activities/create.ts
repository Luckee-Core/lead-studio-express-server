import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadActivity } from './get-all';

export type CreateLeadActivityInput = {
  lead_id: string;
  customer_id: string;
  customer_name: string;
  activity_type?: 'lead_opened';
};

export const createLeadActivity = async (
  supabase: SupabaseClient,
  input: CreateLeadActivityInput
): Promise<LeadActivity> => {
  const { data, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: input.lead_id,
      customer_id: input.customer_id,
      customer_name: input.customer_name,
      activity_type: input.activity_type ?? 'lead_opened',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead activity: ${error.message}`);
  }

  return data;
};
