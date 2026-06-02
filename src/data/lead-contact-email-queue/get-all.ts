/**
 * Get All Lead Contact Email Queue Items
 * Retrieves all queue items with optional filters
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LeadContactEmailQueueRow = {
  id: string;
  lead_contact_id: string;
  lead_id: string;
  persona_id: string | null;
  campaign_id: string | null;
  type: string;
  lead_contact_email_id: string | null;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type GetAllQueueItemsFilters = {
  status?: string;
  lead_id?: string;
  lead_contact_id?: string;
  campaign_id?: string;
  limit?: number;
  offset?: number;
};

export const getAllQueueItems = async (
  supabase: SupabaseClient,
  filters?: GetAllQueueItemsFilters
): Promise<LeadContactEmailQueueRow[]> => {
  let query = supabase
    .from('lead_contact_email_queue')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }

  if (filters?.lead_contact_id) {
    query = query.eq('lead_contact_id', filters.lead_contact_id);
  }

  if (filters?.campaign_id) {
    query = query.eq('campaign_id', filters.campaign_id);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset !== undefined) {
    const end = filters.offset + (filters.limit ?? 100) - 1;
    query = query.range(filters.offset, end);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch queue items: ${error.message}`);
  }

  return (data || []) as LeadContactEmailQueueRow[];
};
