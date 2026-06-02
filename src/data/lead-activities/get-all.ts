import { SupabaseClient } from '@supabase/supabase-js';

export type LeadActivity = {
  id: string;
  lead_id: string;
  customer_id: string;
  customer_name: string;
  activity_type: 'lead_opened';
  created_at: string;
};

export const getAllLeadActivities = async (
  supabase: SupabaseClient
): Promise<LeadActivity[]> => {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead activities: ${error.message}`);
  }

  return data || [];
};
