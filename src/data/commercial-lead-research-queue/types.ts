export type CommercialLeadResearchQueueStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type CommercialLeadResearchQueueRow = {
  id: string;
  batch_id: string;
  lead_id: string;
  status: CommercialLeadResearchQueueStatus;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  /** From joined `leads` when present */
  lead_business_name?: string | null;
  lead_name?: string | null;
};
