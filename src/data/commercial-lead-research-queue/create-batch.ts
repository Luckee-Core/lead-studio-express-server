import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Inserts one queued row per lead (shared `batch_id`).
 */
export const createCommercialLeadResearchBatch = async (
  supabase: SupabaseClient,
  batchId: string,
  leadIds: string[]
): Promise<void> => {
  const now = new Date().toISOString();
  const rows = leadIds.map((leadId) => ({
    batch_id: batchId,
    lead_id: leadId,
    status: 'queued' as const,
    scheduled_at: now,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase.from('commercial_lead_research_queue').insert(rows);

  if (error) {
    throw new Error(`Failed to insert commercial research queue rows: ${error.message}`);
  }
};
