/**
 * Update Lead Sent Email By SendGrid Message ID
 * Updates a lead_sent_emails record using the SendGrid message ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface UpdateLeadSentEmailBySgMessageIdInput {
  opened_at?: string | null;
  opened_count?: number;
}

export const updateLeadSentEmailBySgMessageId = async (
  supabase: SupabaseClient,
  sgMessageId: string,
  input: UpdateLeadSentEmailBySgMessageIdInput
): Promise<boolean> => {
  const updateData: Record<string, any> = {};

  if (input.opened_at !== undefined) {
    updateData.opened_at = input.opened_at;
  }

  if (input.opened_count !== undefined) {
    updateData.opened_count = input.opened_count;
  }

  if (Object.keys(updateData).length === 0) {
    return false;
  }

  const { error } = await supabase
    .from('lead_sent_emails')
    .update(updateData)
    .eq('sg_message_id', sgMessageId);

  if (error) {
    console.error(`Failed to update lead_sent_email by sg_message_id ${sgMessageId}:`, error);
    return false;
  }

  return true;
};
