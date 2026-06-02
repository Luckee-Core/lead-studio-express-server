import { SupabaseClient } from '@supabase/supabase-js';
import type { ToCallLog, ToCallLogStatus } from './types';

export type GetAllToCallLogFilters = {
  lead_id?: string;
  lead_contact_id?: string;
  lead_contact_email_queue_id?: string;
  call_status?: ToCallLogStatus;
  limit?: number;
  offset?: number;
};

export const getAllToCallLog = async (
  supabase: SupabaseClient,
  filters?: GetAllToCallLogFilters
): Promise<ToCallLog[]> => {
  let query = supabase
    .from('to_call_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }

  if (filters?.lead_contact_id) {
    query = query.eq('lead_contact_id', filters.lead_contact_id);
  }

  if (filters?.lead_contact_email_queue_id) {
    query = query.eq(
      'lead_contact_email_queue_id',
      filters.lead_contact_email_queue_id
    );
  }

  if (filters?.call_status) {
    query = query.eq('call_status', filters.call_status);
  }

  if (typeof filters?.offset === 'number' && typeof filters?.limit === 'number') {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  } else if (typeof filters?.limit === 'number') {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch to_call_log rows: ${error.message}`);
  }

  return data || [];
};
