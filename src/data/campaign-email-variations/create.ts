/**
 * Create Campaign Email Variation
 * Creates a new email variation for a campaign
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CampaignEmailVariation } from './get-by-id';
import type { TiptapContent } from '../lead-contact-emails/tiptap-types';

export interface CreateCampaignEmailVariationInput {
  campaign_id: string;
  subject: string;
  body: TiptapContent;
}

export const createCampaignEmailVariation = async (
  supabase: SupabaseClient,
  input: CreateCampaignEmailVariationInput
): Promise<CampaignEmailVariation> => {
  const { data, error } = await supabase
    .from('campaign_email_variations')
    .insert({
      campaign_id: input.campaign_id,
      subject: input.subject,
      body: input.body,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create campaign email variation: ${error.message}`);
  }

  return data;
};
