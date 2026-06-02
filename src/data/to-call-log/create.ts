import { SupabaseClient } from '@supabase/supabase-js';
import type { CreateToCallLogInput, ToCallLog } from './types';

export const createToCallLog = async (
  supabase: SupabaseClient,
  input: CreateToCallLogInput
): Promise<ToCallLog> => {
  const { data, error } = await supabase
    .from('to_call_log')
    .insert({
      lead_id: input.lead_id,
      lead_contact_id: input.lead_contact_id,
      lead_contact_email_queue_id: input.lead_contact_email_queue_id ?? null,
      notes: input.notes,
      call_notes:
        input.call_notes === undefined || input.call_notes === null
          ? null
          : input.call_notes.trim() || null,
      call_status: input.call_status ?? 'queued',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create to_call_log row: ${error.message}`);
  }

  return data;
};
