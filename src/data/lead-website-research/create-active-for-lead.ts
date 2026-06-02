import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadResearchRunRow } from '../../types/lead-research';

export const createActiveLeadWebsiteResearch = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadResearchRunRow> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lead_website_research')
    .insert({
      lead_id: leadId,
      status: 'active',
      started_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(`createActive website research: ${error.message}`);
  return data as LeadResearchRunRow;
};
