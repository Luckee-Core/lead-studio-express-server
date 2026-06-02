/**
 * Update Lead
 * Updates an existing lead
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from './get-all';
import { findLeadCategoryByNormalizedName } from '../lead-categories';

export type UpdateLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
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
  category_id?: string;
  category_name?: string;
  quality_score?: number;
  summary?: unknown;
  is_ready_for_lead_digest?: boolean;
  lead_digest_call_reason?: string | null;
  lead_digest_call_reason_generated_at?: string | null;
};

export const updateLead = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateLeadInput
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

  const updateData = {
    ...input,
    ...(categoryId !== undefined && { category_id: categoryId }),
  };

  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`);
  }

  return data;
};
