import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommercialLeadResearchQueueRow } from './types';

const mapRow = (raw: Record<string, unknown>): CommercialLeadResearchQueueRow => ({
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
});

/**
 * Atomically moves `queued` → `processing` for one row (race-safe).
 */
export const claimCommercialLeadResearchStep = async (
  supabase: SupabaseClient,
  id: string
): Promise<CommercialLeadResearchQueueRow | null> => {
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('commercial_lead_research_queue')
    .update({
      status: 'processing',
      started_at: startedAt,
      updated_at: startedAt,
    })
    .eq('id', id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to claim commercial research queue row: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRow(data as Record<string, unknown>);
};
