import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunRow } from '../../types/lead-research';

export const createActiveLeadFacebookPageResearch = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadResearchRunRow> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lead_facebook_page_research')
    .insert({
      lead_id: leadId,
      status: 'active',
      started_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(`createActive facebook page research: ${error.message}`);
  return data as LeadResearchRunRow;
};
