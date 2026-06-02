/**
 * Update Campaign Email Variation
 * Updates an existing email variation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CampaignEmailVariation } from './get-by-id';
import type { TiptapContent } from '../lead-contact-emails/tiptap-types';

export interface UpdateCampaignEmailVariationInput {
  subject?: string;
  body?: TiptapContent;
}

export const updateCampaignEmailVariation = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateCampaignEmailVariationInput
): Promise<CampaignEmailVariation> => {
  const updateData: Partial<UpdateCampaignEmailVariationInput> = {};
  if (input.subject !== undefined) updateData.subject = input.subject;
  if (input.body !== undefined) updateData.body = input.body;

  const { data, error } = await supabase
    .from('campaign_email_variations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update campaign email variation: ${error.message}`);
  }

  return data;
};
