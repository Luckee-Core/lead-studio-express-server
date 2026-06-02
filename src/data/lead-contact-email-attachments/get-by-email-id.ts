/**
 * Get Attachments By Email ID
 * Retrieves all attachments for a lead contact email
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadContactEmailAttachment } from './types';

/**
 * PostgREST / Supabase when the table is missing from the API schema cache.
 */
const isMissingAttachmentsTableError = (error: {
  code?: string;
  message?: string;
}): boolean => {
  if (error.code === 'PGRST205') return true;
  const msg = error.message ?? '';
  return msg.includes('schema cache') || msg.includes('Could not find the table');
};

export const getAttachmentsByEmailId = async (
  supabase: SupabaseClient,
  emailId: string
): Promise<LeadContactEmailAttachment[]> => {
  const { data, error } = await supabase
    .from('lead_contact_email_attachments')
    .select('*')
    .eq('lead_contact_email_id', emailId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingAttachmentsTableError(error)) {
      console.warn(
        '⚠️ lead_contact_email_attachments unavailable; returning []. Apply migrations/076_create_lead_contact_email_attachments.sql'
      );
      return [];
    }
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }

  return data || [];
};
