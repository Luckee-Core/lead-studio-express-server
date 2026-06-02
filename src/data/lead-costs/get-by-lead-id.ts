/**
 * Get Lead Costs by Lead ID
 * Fetches all costs for a given lead
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LeadCost = {
  id: string;
  lead_id: string;
  type: string;
  description: string | null;
  cost_cents: number;
  entry_source: 'user' | 'ai';
  created_at: string;
};

export const getLeadCostsByLeadId = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadCost[]> => {
  const { data, error } = await supabase
    .from('lead_costs')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead costs: ${error.message}`);
  }

  const rows = data || [];
  return rows.map((row) => ({
    ...row,
    entry_source: row.entry_source === 'ai' ? 'ai' : 'user',
  }));
};
