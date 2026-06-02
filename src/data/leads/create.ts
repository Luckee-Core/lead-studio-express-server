/**
 * Create Lead
 * Creates a new lead
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from './get-all';
import { findLeadCategoryByNormalizedName } from '../lead-categories';

export type CreateLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  address?: string;
  website?: string;
  website_urls?: string[];
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  google_reviews_url?: string;
  has_quote_form?: boolean;
  has_chat_bot?: boolean;
  has_phone_quote?: boolean;
  notes?: string;
  description?: string;
  status?:
    | 'not_contacted'
    | 'not_answered'
    | 'contacted'
    | 'in_call_log'
    | 'lost'
    | 'archived';
  archive_reason?: string;
  idempotency_key: string;
  search_run_id?: string;
  category_id?: string;
  category_name?: string;
  quality_score?: number;
  summary?: unknown;
};

export const createLead = async (
  supabase: SupabaseClient,
  input: CreateLeadInput
): Promise<Lead> => {
  let categoryId = input.category_id;
  if (!categoryId && input.category_name) {
    const category = await findLeadCategoryByNormalizedName(
      supabase,
      input.category_name
    );
    if (category) {
      categoryId = category.id;
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      category_id: categoryId,
      has_quote_form: input.has_quote_form ?? false,
      has_chat_bot: input.has_chat_bot ?? false,
      has_phone_quote: input.has_phone_quote ?? false,
      status: input.status ?? 'not_contacted',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return data;
};
