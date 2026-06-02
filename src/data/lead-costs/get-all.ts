/**
 * Get All Lead Costs
 * Fetches all lead costs, optionally filtered by lead_id
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadCost } from './get-by-lead-id';

export type GetAllLeadCostsParams = {
  lead_id?: string;
};

export const getAllLeadCosts = async (
  supabase: SupabaseClient,
  params?: GetAllLeadCostsParams
): Promise<LeadCost[]> => {
  let query = supabase
    .from('lead_costs')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.lead_id) {
    query = query.eq('lead_id', params.lead_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch lead costs: ${error.message}`);
  }

  return data || [];
};
