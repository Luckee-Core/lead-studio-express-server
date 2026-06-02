import { SupabaseClient } from '@supabase/supabase-js';

export const insertLeadOpportunityDictationResponse = async (
  supabase: SupabaseClient,
  id: string,
  structured: unknown
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_opportunity_dictation_responses').insert({
    id,
    structured,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadOpportunityDictationResponse:', error);
    throw new Error(error.message);
  }
};
