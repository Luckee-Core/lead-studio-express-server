import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommercialLeadResearchQueueStatus } from './types';

type UpdateCommercialLeadResearchQueueStatusInput = {
  status: CommercialLeadResearchQueueStatus;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
};

/**
 * Updates a commercial lead research queue row by id.
 */
export const updateCommercialLeadResearchQueueStatus = async (
  supabase: SupabaseClient,
  id: string,
  patch: UpdateCommercialLeadResearchQueueStatusInput
): Promise<void> => {
  const { error } = await supabase
    .from('commercial_lead_research_queue')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update commercial research queue row: ${error.message}`);
  }
};
