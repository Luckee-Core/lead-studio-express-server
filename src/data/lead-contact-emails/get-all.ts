/**
 * Get All Lead Contact Emails
 * Retrieves all lead contact emails
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface LeadContactEmail {
  id: string;
  lead_id: string;
  lead_contact_id: string;
  subject: string;
  body: Record<string, any>; // TiptapContent JSONB
  campaign_ids: string[];
  created_at: string;
  updated_at: string;
  variation_id?: number | null;
  email_sending_identity_id?: string | null;
  cold_email_offering_id?: string | null;
}
