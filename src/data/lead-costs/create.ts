/**
 * Create a persisted lead cost row (manual user entry or future AI agent).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { LeadCost } from './get-by-lead-id';

const ALLOWED_TYPES = new Set([
  'discovery',
  'website_scrape',
  'ai_summary',
  'ai_email',
  'ai_contact_extraction',
  'design_tool',
  'other',
]);

export type CreateLeadCostInput = {
  lead_id: string;
  type: string;
  description: string;
  cost_cents: number;
  entry_source?: 'user' | 'ai';
};

export const createLeadCost = async (
  supabase: SupabaseClient,
  input: CreateLeadCostInput,
): Promise<LeadCost> => {
  const description = input.description?.trim() ?? '';
  if (!input.lead_id) {
    throw new Error('lead_id is required');
  }
  if (!description) {
    throw new Error('description is required');
  }
  if (!ALLOWED_TYPES.has(input.type)) {
    throw new Error(`Invalid type: ${input.type}`);
  }
  const costCents = Math.round(Number(input.cost_cents));
  if (!Number.isFinite(costCents) || costCents < 0) {
    throw new Error('cost_cents must be a non-negative integer');
  }

  const entrySource = input.entry_source === 'ai' ? 'ai' : 'user';

  const { data, error } = await supabase
    .from('lead_costs')
    .insert({
      lead_id: input.lead_id,
      type: input.type,
      description,
      cost_cents: costCents,
      entry_source: entrySource,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead cost: ${error.message}`);
  }

  return data as LeadCost;
};
