/**
 * Get Attachment By ID
 * Retrieves a single attachment by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailAttachment } from './types';

export const getAttachmentById = async (
  supabase: SupabaseClient,
  id: string
): Promise<LeadContactEmailAttachment | null> => {
  const { data, error } = await supabase
    .from('lead_contact_email_attachments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch attachment: ${error.message}`);
  }

  return data;
};
