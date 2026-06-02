import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContactActivity } from './get-all';

export type CreateLeadContactActivityInput = {
  lead_contact_id: string;
  lead_id: string;
  customer_id: string;
  customer_name: string;
  activity_type?: 'lead_contact_opened';
};

export const createLeadContactActivity = async (
  supabase: SupabaseClient,
  input: CreateLeadContactActivityInput
): Promise<LeadContactActivity> => {
  const { data, error } = await supabase
    .from('lead_contact_activities')
    .insert({
      lead_contact_id: input.lead_contact_id,
      lead_id: input.lead_id,
      customer_id: input.customer_id,
      customer_name: input.customer_name,
      activity_type: input.activity_type ?? 'lead_contact_opened',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create lead contact activity: ${error.message}`);
  }

  return data;
};
