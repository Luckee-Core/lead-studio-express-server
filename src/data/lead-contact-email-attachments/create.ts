/**
 * Create Lead Contact Email Attachment
 * Creates a new attachment record
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailAttachment, CreateAttachmentInput } from './types';

export const createAttachment = async (
  supabase: SupabaseClient,
  input: CreateAttachmentInput
): Promise<LeadContactEmailAttachment> => {
  const { data, error } = await supabase
    .from('lead_contact_email_attachments')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create attachment: ${error.message}`);
  }

  return data;
};
