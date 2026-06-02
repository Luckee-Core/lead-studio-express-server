/**
 * Update Queue Item Status
 * Updates the status of a queue item and optionally sets sent_at or error_message
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailQueue, LeadContactEmailQueueStatus } from './types';

export interface UpdateQueueItemStatusInput {
  status: LeadContactEmailQueueStatus;
  sent_at?: string;
  error_message?: string;
  scheduled_at?: string;
}

export const updateQueueItemStatus = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateQueueItemStatusInput
): Promise<LeadContactEmailQueue> => {
  const updateData: Record<string, unknown> = {
    status: input.status,
  };

  if (input.sent_at !== undefined) {
    updateData.sent_at = input.sent_at;
  }

  if (input.error_message !== undefined) {
    updateData.error_message = input.error_message;
  }

  if (input.scheduled_at !== undefined) {
    updateData.scheduled_at = input.scheduled_at;
  }

  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update queue item status: ${error.message}`);
  }

  return data;
};
