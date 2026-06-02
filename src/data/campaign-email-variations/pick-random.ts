/**
 * Pick Random Campaign Email Variation
 * Randomly selects a variation from a campaign
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CampaignEmailVariation } from './get-by-id';
import { getAllCampaignEmailVariations } from './get-all';

export const pickRandomCampaignEmailVariation = async (
  supabase: SupabaseClient,
  campaign_id: string
): Promise<CampaignEmailVariation | null> => {
  const variations = await getAllCampaignEmailVariations(supabase, campaign_id);

  if (variations.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
};
