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
 * Oldest due `queued` row (FIFO).
 */
export const getNextQueuedCommercialLeadResearchRow = async (
  supabase: SupabaseClient
): Promise<CommercialLeadResearchQueueRow | null> => {
  const { data, error } = await supabase
    .from('commercial_lead_research_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch next commercial research queue row: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRow(data as Record<string, unknown>);
};
