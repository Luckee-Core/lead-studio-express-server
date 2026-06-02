/**
 * Delete Campaign Email Variation
 * Deletes a variation by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteCampaignEmailVariation = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('campaign_email_variations')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete campaign email variation: ${error.message}`);
  }
};
