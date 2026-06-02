/**
 * Create Lead Contact
 * Creates a new lead contact
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadContact } from './get-by-lead-id';

export type CreateLeadContactInput = {
  lead_id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
  status?: string;
};

export const createLeadContact = async (
  supabase: SupabaseClient,
  input: CreateLeadContactInput
): Promise<LeadContact> => {
  const { data, error } = await supabase
    .from('lead_contacts')
    .insert({
      lead_id: input.lead_id,
      name: input.name || '',
      email: input.email ?? null,
      phone: input.phone ?? null,
      role: input.role ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'not_contacted',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead contact: ${error.message}`);
  }

  return data;
};
