import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractedWebsitePerson } from '../../ai/website-content/extract-people-from-crawl';
import { createLeadContact, getLeadContactsByLeadId } from '../../data/lead-contacts';
import type { LeadContact } from '../../data/lead-contacts/get-by-lead-id';
import { findLeadContactDuplicateForReachOut } from '../../utils/lead-contacts';

/**
 * Inserts `lead_contacts` from AI-extracted people (name, title, email, phone).
 */
export const applyWebsiteCrawlContactsFromAi = async (
  supabase: SupabaseClient,
  leadId: string,
  people: ExtractedWebsitePerson[]
): Promise<{ created: number }> => {
  if (people.length === 0) {
    return { created: 0 };
  }

  const existing = await getLeadContactsByLeadId(supabase, leadId);
  const working: LeadContact[] = [...existing];
  let created = 0;

  for (const p of people) {
    const dup = findLeadContactDuplicateForReachOut(working, p.email, p.phone);
    if (dup) continue;

    await createLeadContact(supabase, {
      lead_id: leadId,
      name: p.name,
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      role: p.title ?? undefined,
      notes: 'Website crawl (AI)',
      status: 'not_contacted',
    });
    created += 1;

    working.push({
      id: `local-${created}`,
      lead_id: leadId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      role: p.title,
      notes: null,
      status: 'not_contacted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (created > 0) {
    console.log(`💾 lead-website-research: created ${created} contact(s) from AI people extraction`, {
      leadId,
    });
  }

  return { created };
};
