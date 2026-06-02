import { SupabaseClient } from '@supabase/supabase-js';

export const insertLeadOpportunityDictationRequest = async (
  supabase: SupabaseClient,
  params: {
    id: string;
    userId: string;
    leadId: string;
    content: string;
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('lead_opportunity_dictation_requests').insert({
    id: params.id,
    user_id: params.userId,
    lead_id: params.leadId,
    content: params.content,
    status: 'pending',
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('❌ insertLeadOpportunityDictationRequest:', error);
    throw new Error(error.message);
  }
};
