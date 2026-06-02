/**
 * Get All Leads
 * Retrieves all leads, optionally filtered by status, category, or search run
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  address: string | null;
  website: string | null;
  website_urls: string[];
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  google_reviews_url: string | null;
  has_quote_form: boolean;
  has_chat_bot: boolean;
  has_phone_quote: boolean;
  notes: string | null;
  description: string | null;
  status:
    | 'not_contacted'
    | 'not_answered'
    | 'contacted'
    | 'in_call_log'
    | 'lost'
    | 'archived';
  archive_reason: string | null;
  idempotency_key: string;
  search_run_id: string | null;
  category_id: string | null;
  category_name: string | null;
  quality_score: number | null;
  summary: unknown | null;
  opportunities?: string[];
  is_ready_for_lead_digest?: boolean;
  lead_digest_call_reason?: string | null;
  lead_digest_call_reason_generated_at?: string | null;
  /** API-only: set when list/single responses are enriched — any `facebook_google_search` row exists. */
  facebook_google_search_attempted?: boolean;
  created_at: string;
  updated_at: string;
};

export type GetAllLeadsParams = {
  status?: string;
  categoryId?: string;
  searchRunId?: string;
};

export const getAllLeads = async (
  supabase: SupabaseClient,
  params?: GetAllLeadsParams
): Promise<Lead[]> => {
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  // Optional filter — when omitted, return every row so the web app can filter client-side
  // (including "Archived" in the status dropdown).
  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params?.searchRunId) {
    query = query.eq('search_run_id', params.searchRunId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return data || [];
};
