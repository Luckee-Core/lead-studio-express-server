import type { SupabaseClient } from '@supabase/supabase-js';
import { identifyLeadIdsForResearchQueue } from '../../data/leads/identify-lead-ids-for-research-queue';
import { enqueueCommercialLeadResearchBatch } from './enqueue-commercial-lead-research-batch';

export type IdentifyLeadsForResearchQueueResult = {
  batchId: string | null;
  insertedCount: number;
  leadIds: string[];
};

/**
 * Identifies up to 10 leads that need Facebook Google SERP work, then enqueues them (queue rows only).
 */
export const identifyLeadsForResearchQueue = async (
  supabase: SupabaseClient
): Promise<IdentifyLeadsForResearchQueueResult> => {
  const leadIds = await identifyLeadIdsForResearchQueue(supabase);

  if (leadIds.length === 0) {
    console.log('📭 identify-leads-for-research-queue: no eligible leads');
    return { batchId: null, insertedCount: 0, leadIds: [] };
  }

  console.log('📥 identify-leads-for-research-queue: enqueueing', {
    count: leadIds.length,
    leadIds,
  });

  const { batchId, insertedCount } = await enqueueCommercialLeadResearchBatch(supabase, leadIds);

  console.log('✅ identify-leads-for-research-queue: done', {
    batchId,
    insertedCount,
  });

  return { batchId, insertedCount, leadIds };
};
