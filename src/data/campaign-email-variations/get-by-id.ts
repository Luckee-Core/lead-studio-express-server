/**
 * Get Campaign Email Variation By ID
 * Retrieves a variation by its ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { TiptapContent } from '../lead-contact-emails/tiptap-types';

export interface CampaignEmailVariation {
  id: string;
  campaign_id: string;
  subject: string;
  body: TiptapContent;
  created_at: string;
  updated_at: string;
}

export const getCampaignEmailVariationById = async (
  supabase: SupabaseClient,
  id: string
): Promise<CampaignEmailVariation | null> => {
  const { data, error } = await supabase
    .from('campaign_email_variations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch campaign email variation: ${error.message}`);
  }

  return data;
};
