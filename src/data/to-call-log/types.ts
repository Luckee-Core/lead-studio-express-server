export type ToCallLogStatus = 'queued' | 'called' | 'skipped' | 'voicemail';

export type ToCallLog = {
  id: string;
  lead_id: string;
  lead_contact_id: string;
  lead_contact_email_queue_id: string | null;
  /** Prep / before the call */
  notes: string;
  /** Captured during or right after the live call */
  call_notes: string | null;
  call_status: ToCallLogStatus;
  called_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateToCallLogInput = {
  lead_id: string;
  lead_contact_id: string;
  lead_contact_email_queue_id?: string | null;
  notes: string;
  call_notes?: string | null;
  call_status?: ToCallLogStatus;
};

/** Partial update; omit fields you do not want to change. */
export type UpdateToCallLogInput = {
  notes?: string;
  call_notes?: string | null;
  call_status?: ToCallLogStatus;
  called_at?: string | null;
};
