import { SupabaseClient } from '@supabase/supabase-js';
import type { ToCallLog, ToCallLogStatus, UpdateToCallLogInput } from './types';

/**
 * Updates a to_call_log row by id. Applies called_at rules when call_status changes.
 */
export const updateToCallLog = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateToCallLogInput
): Promise<ToCallLog> => {
  const row: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (input.notes !== undefined) {
    const trimmed = input.notes.trim();
    if (!trimmed) {
      throw new Error('notes cannot be empty');
    }
    row.notes = trimmed;
  }

  if (input.call_notes !== undefined) {
    if (input.call_notes === null || input.call_notes === '') {
      row.call_notes = null;
    } else {
      const t = input.call_notes.trim();
      row.call_notes = t || null;
    }
  }

  if (input.call_status !== undefined) {
    row.call_status = input.call_status;
    if (input.call_status === 'called' || input.call_status === 'voicemail') {
      row.called_at = input.called_at ?? new Date().toISOString();
    } else {
      row.called_at = input.called_at ?? null;
    }
  } else if (input.called_at !== undefined) {
    row.called_at = input.called_at;
  }

  const keys = Object.keys(row).filter((k) => k !== 'updated_at');
  if (keys.length === 0) {
    throw new Error('No fields to update');
  }

  const { data, error } = await supabase
    .from('to_call_log')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update to_call_log: ${error.message}`);
  }

  return data;
};
