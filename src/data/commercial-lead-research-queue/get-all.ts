import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommercialLeadResearchQueueRow } from './types';

const mapRow = (raw: Record<string, unknown>): CommercialLeadResearchQueueRow => {
  const leadsRaw = raw.leads;
  let lead_business_name: string | null | undefined;
  let lead_name: string | null | undefined;
  if (leadsRaw && typeof leadsRaw === 'object' && !Array.isArray(leadsRaw)) {
    const L = leadsRaw as Record<string, unknown>;
    lead_business_name =
      typeof L.business_name === 'string' ? L.business_name : L.business_name == null ? null : undefined;
    lead_name = typeof L.name === 'string' ? L.name : L.name == null ? null : undefined;
  }

  return {
    id: String(raw.id),
    batch_id: String(raw.batch_id),
    lead_id: String(raw.lead_id),
    status: raw.status as CommercialLeadResearchQueueRow['status'],
    scheduled_at: String(raw.scheduled_at),
    started_at: raw.started_at != null ? String(raw.started_at) : null,
    completed_at: raw.completed_at != null ? String(raw.completed_at) : null,
    error_message: raw.error_message != null ? String(raw.error_message) : null,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    ...(lead_business_name !== undefined ? { lead_business_name } : {}),
    ...(lead_name !== undefined ? { lead_name } : {}),
  };
};

/**
 * Recent commercial lead research queue rows (newest first), with lead labels when join succeeds.
 */
export const getAllCommercialLeadResearchQueue = async (
  supabase: SupabaseClient,
  limit = 200
): Promise<CommercialLeadResearchQueueRow[]> => {
  const { data, error } = await supabase
    .from('commercial_lead_research_queue')
    .select('*, leads(business_name, name)')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) {
    throw new Error(`Failed to fetch commercial lead research queue: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
};
