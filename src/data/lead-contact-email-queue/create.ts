/**
 * Create Queue Item
 * Adds a lead contact to the email queue
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailQueue, CreateQueueItemInput } from './types';

export const createQueueItem = async (
  supabase: SupabaseClient,
  input: CreateQueueItemInput
): Promise<LeadContactEmailQueue> => {
  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .insert({
      lead_contact_id: input.lead_contact_id,
      lead_id: input.lead_id,
      persona_id: input.persona_id ?? null,
      campaign_id: input.campaign_id ?? null,
      type: input.type,
      lead_contact_email_id: input.lead_contact_email_id ?? null,
      scheduled_at: input.scheduled_at,
      status: 'queued',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create queue item: ${error.message}`);
  }

  return data;
};
