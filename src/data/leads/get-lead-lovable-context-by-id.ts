import type { SupabaseClient } from '@supabase/supabase-js';

export type LeadLovableContext = {
  businessName: string | null;
  name: string | null;
  description: string | null;
  address: string | null;
  website: string | null;
};

/**
 * Loads minimal lead fields for Lovable prompt enrichment. Returns null if missing or on error.
 */
export const getLeadLovableContextById = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadLovableContext | null> => {
  const { data, error } = await supabase
    .from('leads')
    .select('business_name, name, description, address, website')
    .eq('id', leadId)
    .maybeSingle();

  if (error) {
    console.warn('⚠️ [getLeadLovableContextById]', error.message);
    return null;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    businessName: typeof row.business_name === 'string' ? row.business_name : null,
    name: typeof row.name === 'string' ? row.name : null,
    description: typeof row.description === 'string' ? row.description : null,
    address: typeof row.address === 'string' ? row.address : null,
    website: typeof row.website === 'string' ? row.website : null,
  };
};
