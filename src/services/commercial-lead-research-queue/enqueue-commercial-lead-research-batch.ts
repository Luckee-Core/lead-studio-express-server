import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { createCommercialLeadResearchBatch } from '../../data/commercial-lead-research-queue';

/**
 * Validates lead IDs and inserts one queued row per lead (shared `batch_id`).
 */
export const enqueueCommercialLeadResearchBatch = async (
  supabase: SupabaseClient,
  leadIds: string[]
): Promise<{ batchId: string; insertedCount: number }> => {
  const unique = [...new Set(leadIds.map((id) => id.trim()).filter((id) => id.length > 0))];
  if (unique.length === 0) {
    throw new Error('leadIds_required');
  }

  const batchId = randomUUID();
  await createCommercialLeadResearchBatch(supabase, batchId, unique);

  return { batchId, insertedCount: unique.length };
};
