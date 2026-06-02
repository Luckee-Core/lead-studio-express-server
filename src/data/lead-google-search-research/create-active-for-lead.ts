import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunRow } from '../../types/lead-research';

export const createActiveLeadGoogleSearchResearch = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadResearchRunRow> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lead_google_search_research')
    .insert({
      lead_id: leadId,
      status: 'active',
      started_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(`createActive google search research: ${error.message}`);
  return data as LeadResearchRunRow;
};
