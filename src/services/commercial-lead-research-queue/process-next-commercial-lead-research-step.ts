import type { SupabaseClient } from '@supabase/supabase-js';
import {
  claimCommercialLeadResearchStep,
  countCommercialLeadResearchProcessing,
  getNextQueuedCommercialLeadResearchRow,
  updateCommercialLeadResearchQueueStatus,
} from '../../data/commercial-lead-research-queue';
import { runSameDomainUrlDiscoveryForLead } from '../lead-same-domain-url-discovery';
import { runWebSerpDiscoveryForLead } from '../lead-research-pipeline';
import { processFacebookGoogleSearchForLead } from '../lead-google-search/facebook/process-facebook-google-search-for-lead';

export type ProcessNextCommercialLeadResearchStepResult = {
  processed: 0 | 1;
  reason?: 'busy' | 'empty' | 'claim_lost';
  batchId?: string;
  leadId?: string;
  queueRowId?: string;
  error?: string;
};

const runFullResearchForLead = async (supabase: SupabaseClient, leadId: string): Promise<void> => {
  const same = await runSameDomainUrlDiscoveryForLead(supabase, leadId);
  if (!same.ok && same.error !== 'website_required' && same.error !== 'lead_not_found') {
    throw new Error(`same_domain:${leadId}:${same.error}`);
  }

  await runWebSerpDiscoveryForLead(supabase, leadId);
  await processFacebookGoogleSearchForLead(supabase, leadId);
};

/**
 * Single-flight worker: at most one `processing` row globally; runs full research for one claimed lead per call.
 */
export const processNextCommercialLeadResearchStep = async (
  supabase: SupabaseClient
): Promise<ProcessNextCommercialLeadResearchStepResult> => {
  const processingCount = await countCommercialLeadResearchProcessing(supabase);
  if (processingCount > 0) {
    return { processed: 0, reason: 'busy' };
  }

  const next = await getNextQueuedCommercialLeadResearchRow(supabase);
  if (!next) {
    return { processed: 0, reason: 'empty' };
  }

  const claimed = await claimCommercialLeadResearchStep(supabase, next.id);
  if (!claimed) {
    return { processed: 0, reason: 'claim_lost' };
  }

  const leadId = claimed.lead_id;

  try {
    await runFullResearchForLead(supabase, leadId);

    const doneAt = new Date().toISOString();
    await updateCommercialLeadResearchQueueStatus(supabase, claimed.id, {
      status: 'completed',
      completed_at: doneAt,
    });

    return {
      processed: 1,
      batchId: claimed.batch_id,
      leadId,
      queueRowId: claimed.id,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateCommercialLeadResearchQueueStatus(supabase, claimed.id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: msg,
    });

    return {
      processed: 1,
      batchId: claimed.batch_id,
      leadId,
      queueRowId: claimed.id,
      error: msg,
    };
  }
};
