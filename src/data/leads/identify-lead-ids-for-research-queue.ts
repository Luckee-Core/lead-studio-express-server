import type { SupabaseClient } from '@supabase/supabase-js';

const TARGET_COUNT = 10;
const LEADS_PAGE_SIZE = 200;
const SIDE_TABLE_CHUNK = 1000;

/**
 * Up to 10 lead IDs: has website, no succeeded `facebook_google_search`, not `queued`/`processing`
 * on `commercial_lead_research_queue`. Oldest leads first (`created_at` ASC).
 */
export const identifyLeadIdsForResearchQueue = async (supabase: SupabaseClient): Promise<string[]> => {
  const succeededLeadIds = new Set<string>();
  let fgsOffset = 0;
  for (;;) {
    const { data: fgsRows, error: fgsError } = await supabase
      .from('facebook_google_search')
      .select('lead_id')
      .eq('status', 'succeeded')
      .range(fgsOffset, fgsOffset + SIDE_TABLE_CHUNK - 1);

    if (fgsError) {
      throw new Error(`Failed to load succeeded facebook_google_search rows: ${fgsError.message}`);
    }
    const chunk = fgsRows ?? [];
    for (const row of chunk) {
      if (typeof row.lead_id === 'string' && row.lead_id) {
        succeededLeadIds.add(row.lead_id);
      }
    }
    if (chunk.length < SIDE_TABLE_CHUNK) break;
    fgsOffset += SIDE_TABLE_CHUNK;
  }

  const activeQueueLeadIds = new Set<string>();
  let qOffset = 0;
  for (;;) {
    const { data: qRows, error: qError } = await supabase
      .from('commercial_lead_research_queue')
      .select('lead_id')
      .in('status', ['queued', 'processing'])
      .range(qOffset, qOffset + SIDE_TABLE_CHUNK - 1);

    if (qError) {
      throw new Error(`Failed to load active commercial_lead_research_queue rows: ${qError.message}`);
    }
    const chunk = qRows ?? [];
    for (const row of chunk) {
      if (typeof row.lead_id === 'string' && row.lead_id) {
        activeQueueLeadIds.add(row.lead_id);
      }
    }
    if (chunk.length < SIDE_TABLE_CHUNK) break;
    qOffset += SIDE_TABLE_CHUNK;
  }

  const picked: string[] = [];
  let leadsOffset = 0;

  while (picked.length < TARGET_COUNT) {
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, website')
      .not('website', 'is', null)
      .neq('website', '')
      .neq('status', 'archived')
      .neq('status', 'lost')
      .order('created_at', { ascending: true })
      .range(leadsOffset, leadsOffset + LEADS_PAGE_SIZE - 1);

    if (leadsError) {
      throw new Error(`Failed to page leads for research queue identification: ${leadsError.message}`);
    }

    const page = leads ?? [];
    if (page.length === 0) break;

    for (const row of page) {
      const id = row.id;
      if (typeof id !== 'string' || !id) continue;
      if (!row.website?.trim()) continue;
      if (succeededLeadIds.has(id)) continue;
      if (activeQueueLeadIds.has(id)) continue;
      picked.push(id);
      if (picked.length >= TARGET_COUNT) break;
    }

    if (page.length < LEADS_PAGE_SIZE) break;
    leadsOffset += LEADS_PAGE_SIZE;
  }

  return picked;
};
