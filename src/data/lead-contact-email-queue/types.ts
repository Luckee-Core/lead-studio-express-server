/**
 * Lead Contact Email Queue Types
 */

export type LeadContactEmailQueueStatus = 'queued' | 'sending' | 'sent' | 'failed';

export type LeadContactEmailQueueType = 'custom_email';

export type LeadContactEmailQueue = {
  id: string;
  lead_contact_id: string;
  lead_id: string;
  /** Email Persona Studio profile (email_persona.id) used for this send, if set. */
  persona_id: string | null;
  campaign_id: string | null;
  type: LeadContactEmailQueueType;
  lead_contact_email_id: string | null;
  status: LeadContactEmailQueueStatus;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateQueueItemInput = {
  lead_contact_id: string;
  lead_id: string;
  persona_id?: string | null;
  campaign_id?: string | null;
  type: LeadContactEmailQueueType;
  lead_contact_email_id?: string | null;
  scheduled_at: string;
};
