/**
 * Get All Campaign Email Variations
 * Retrieves all variations for a campaign
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CampaignEmailVariation } from './get-by-id';

export const getAllCampaignEmailVariations = async (
  supabase: SupabaseClient,
  campaign_id: string
): Promise<CampaignEmailVariation[]> => {
  const { data, error } = await supabase
    .from('campaign_email_variations')
    .select('*')
    .eq('campaign_id', campaign_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch campaign email variations: ${error.message}`);
  }

  return data || [];
};
