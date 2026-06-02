import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactActivity = {
  id: string;
  lead_contact_id: string;
  lead_id: string;
  customer_id: string;
  customer_name: string;
  activity_type: 'lead_contact_opened';
  created_at: string;
};

export const getAllLeadContactActivities = async (
  supabase: SupabaseClient
): Promise<LeadContactActivity[]> => {
  const { data, error } = await supabase
    .from('lead_contact_activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead contact activities: ${error.message}`);
  }

  return data || [];
};
