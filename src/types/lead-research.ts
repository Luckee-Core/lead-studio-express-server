/**
 * Status for lead_*_research job rows.
 */
export type LeadResearchRunStatus = 'active' | 'succeeded' | 'failed';

export type LeadResearchRunRow = {
  id: string;
  lead_id: string;
  status: LeadResearchRunStatus;
  error_message: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};
