import { SupabaseClient } from '@supabase/supabase-js';

export type LeadAiExchangeCostRow = {
  id: string;
  source:
    | 'lead_contact_chat'
    | 'lead_website_ai'
    | 'lead_google_search_ai'
    | 'lead_facebook_posts_ai'
    | 'lead_contact_email_draft_ai';
  label: string;
  created_at: string;
  input_tokens: number;
  output_tokens: number;
  model_used: string;
};

const GOOGLE_PROFILE_SEARCH_PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
};

/**
 * Human-readable suffix for Google profile SERP AI rows (Facebook run vs research run + payload.platform).
 */
const buildLeadGoogleSearchAiCostLabel = (input: {
  facebook_google_search_run_id: string | null;
  request_payload_json: Record<string, unknown> | null | undefined;
}): string => {
  if (input.facebook_google_search_run_id) {
    return 'Google profile search · Facebook';
  }
  const raw =
    input.request_payload_json &&
    typeof input.request_payload_json.platform === 'string'
      ? input.request_payload_json.platform.trim().toLowerCase()
      : '';
  const platformLabel =
    (raw && GOOGLE_PROFILE_SEARCH_PLATFORM_LABEL[raw]) ||
    (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Instagram / LinkedIn');
  return `Google profile search · ${platformLabel}`;
};

/**
 * Loads AI exchange rows for cost display: contact chat, website “at a glance” AI, Google profile SERP AI, Facebook posts activity score AI, and contact email draft AI.
 * Token counts come from exchange rows (contact chat) or joined response rows (other sources).
 */
export const getAiExchangeCostRowsForLead = async (
  supabase: SupabaseClient,
  leadId: string,
): Promise<LeadAiExchangeCostRow[]> => {
  const rows: LeadAiExchangeCostRow[] = [];

  const { data: contacts, error: contactsError } = await supabase
    .from('lead_contacts')
    .select('id, name')
    .eq('lead_id', leadId);

  if (contactsError) {
    throw new Error(`Failed to fetch lead contacts: ${contactsError.message}`);
  }

  const contactList = contacts ?? [];
  const contactIds = contactList.map((c) => c.id);
  const contactNameById = new Map(contactList.map((c) => [c.id, c.name]));

  if (contactIds.length > 0) {
    const { data: contactExchanges, error: exError } = await supabase
      .from('lead_contact_chat_exchanges')
      .select('id, created_at, input_tokens, output_tokens, model_used, lead_contact_id')
      .in('lead_contact_id', contactIds)
      .order('created_at', { ascending: false });

    if (exError) {
      throw new Error(`Failed to fetch lead contact chat exchanges: ${exError.message}`);
    }

    for (const ex of contactExchanges ?? []) {
      const name = contactNameById.get(ex.lead_contact_id) ?? 'Contact';
      rows.push({
        id: ex.id,
        source: 'lead_contact_chat',
        label: `Contact chat · ${name}`,
        created_at: ex.created_at,
        input_tokens: Number(ex.input_tokens ?? 0),
        output_tokens: Number(ex.output_tokens ?? 0),
        model_used: String(ex.model_used ?? ''),
      });
    }
  }

  const { data: websiteExchanges, error: websiteExError } = await supabase
    .from('lead_website_ai_exchanges')
    .select('id, created_at, response_id')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (websiteExError) {
    throw new Error(`Failed to fetch lead website AI exchanges: ${websiteExError.message}`);
  }

  const responseIds = (websiteExchanges ?? [])
    .map((e) => e.response_id)
    .filter((id): id is string => Boolean(id));

  if (responseIds.length > 0) {
    const { data: responses, error: respError } = await supabase
      .from('lead_website_ai_responses')
      .select('id, usage_input_tokens, usage_output_tokens, model')
      .in('id', responseIds);

    if (respError) {
      throw new Error(`Failed to fetch lead website AI responses: ${respError.message}`);
    }

    const responseById = new Map((responses ?? []).map((r) => [r.id, r]));

    for (const ex of websiteExchanges ?? []) {
      const r = ex.response_id ? responseById.get(ex.response_id) : undefined;
      rows.push({
        id: ex.id,
        source: 'lead_website_ai',
        label: 'At a glance · website AI',
        created_at: ex.created_at,
        input_tokens: Number(r?.usage_input_tokens ?? 0),
        output_tokens: Number(r?.usage_output_tokens ?? 0),
        model_used: String(r?.model ?? ''),
      });
    }
  }

  const { data: googleSearchExchanges, error: googleSearchExError } = await supabase
    .from('lead_google_search_ai_exchanges')
    .select(
      'id, created_at, response_id, request_id, facebook_google_search_run_id, research_run_id',
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (googleSearchExError) {
    throw new Error(
      `Failed to fetch lead Google search AI exchanges: ${googleSearchExError.message}`,
    );
  }

  const googleResponseIds = (googleSearchExchanges ?? [])
    .map((e) => e.response_id)
    .filter((id): id is string => Boolean(id));

  let googleResponseById = new Map<
    string,
    { usage_input_tokens: number | null; usage_output_tokens: number | null; model: string | null }
  >();

  if (googleResponseIds.length > 0) {
    const { data: googleResponses, error: googleRespError } = await supabase
      .from('lead_google_search_ai_responses')
      .select('id, usage_input_tokens, usage_output_tokens, model')
      .in('id', googleResponseIds);

    if (googleRespError) {
      throw new Error(
        `Failed to fetch lead Google search AI responses: ${googleRespError.message}`,
      );
    }

    googleResponseById = new Map((googleResponses ?? []).map((r) => [r.id, r]));
  }

  const googleRequestIds = (googleSearchExchanges ?? [])
    .map((e) => e.request_id)
    .filter((id): id is string => Boolean(id));

  let googleRequestPayloadById = new Map<string, Record<string, unknown>>();

  if (googleRequestIds.length > 0) {
    const { data: googleRequests, error: googleReqError } = await supabase
      .from('lead_google_search_ai_requests')
      .select('id, request_payload_json')
      .in('id', googleRequestIds);

    if (googleReqError) {
      throw new Error(
        `Failed to fetch lead Google search AI requests: ${googleReqError.message}`,
      );
    }

    googleRequestPayloadById = new Map(
      (googleRequests ?? []).map((q) => [
        q.id,
        (q.request_payload_json as Record<string, unknown> | null) ?? {},
      ]),
    );
  }

  for (const ex of googleSearchExchanges ?? []) {
    const r = ex.response_id ? googleResponseById.get(ex.response_id) : undefined;
    const payload = ex.request_id ? googleRequestPayloadById.get(ex.request_id) : undefined;
    rows.push({
      id: ex.id,
      source: 'lead_google_search_ai',
      label: buildLeadGoogleSearchAiCostLabel({
        facebook_google_search_run_id: ex.facebook_google_search_run_id ?? null,
        request_payload_json: payload,
      }),
      created_at: ex.created_at,
      input_tokens: Number(r?.usage_input_tokens ?? 0),
      output_tokens: Number(r?.usage_output_tokens ?? 0),
      model_used: String(r?.model ?? ''),
    });
  }

  const { data: facebookPostsExchanges, error: facebookPostsExError } = await supabase
    .from('lead_facebook_posts_ai_exchanges')
    .select('id, created_at, response_id')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (facebookPostsExError) {
    throw new Error(
      `Failed to fetch lead Facebook posts AI exchanges: ${facebookPostsExError.message}`,
    );
  }

  const facebookResponseIds = (facebookPostsExchanges ?? [])
    .map((e) => e.response_id)
    .filter((id): id is string => Boolean(id));

  if (facebookResponseIds.length > 0) {
    const { data: facebookResponses, error: facebookRespError } = await supabase
      .from('lead_facebook_posts_ai_responses')
      .select('id, usage_input_tokens, usage_output_tokens, model')
      .in('id', facebookResponseIds);

    if (facebookRespError) {
      throw new Error(
        `Failed to fetch lead Facebook posts AI responses: ${facebookRespError.message}`,
      );
    }

    const facebookResponseById = new Map((facebookResponses ?? []).map((r) => [r.id, r]));

    for (const ex of facebookPostsExchanges ?? []) {
      const r = ex.response_id ? facebookResponseById.get(ex.response_id) : undefined;
      rows.push({
        id: ex.id,
        source: 'lead_facebook_posts_ai',
        label: 'Facebook posts · activity score',
        created_at: ex.created_at,
        input_tokens: Number(r?.usage_input_tokens ?? 0),
        output_tokens: Number(r?.usage_output_tokens ?? 0),
        model_used: String(r?.model ?? ''),
      });
    }
  }

  const { data: emailDraftExchanges, error: emailDraftExError } = await supabase
    .from('lead_contact_email_draft_ai_exchanges')
    .select('id, created_at, response_id, lead_contact_id')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (emailDraftExError) {
    throw new Error(
      `Failed to fetch lead contact email draft AI exchanges: ${emailDraftExError.message}`,
    );
  }

  const emailDraftResponseIds = (emailDraftExchanges ?? [])
    .map((e) => e.response_id)
    .filter((id): id is string => Boolean(id));

  if (emailDraftResponseIds.length > 0) {
    const { data: emailDraftResponses, error: emailDraftRespError } = await supabase
      .from('lead_contact_email_draft_ai_responses')
      .select('id, usage_input_tokens, usage_output_tokens, model')
      .in('id', emailDraftResponseIds);

    if (emailDraftRespError) {
      throw new Error(
        `Failed to fetch lead contact email draft AI responses: ${emailDraftRespError.message}`,
      );
    }

    const emailDraftResponseById = new Map(
      (emailDraftResponses ?? []).map((r) => [r.id, r]),
    );

    for (const ex of emailDraftExchanges ?? []) {
      const r = ex.response_id ? emailDraftResponseById.get(ex.response_id) : undefined;
      const contactName = contactNameById.get(ex.lead_contact_id) ?? 'Contact';
      rows.push({
        id: ex.id,
        source: 'lead_contact_email_draft_ai',
        label: `Email draft · ${contactName}`,
        created_at: ex.created_at,
        input_tokens: Number(r?.usage_input_tokens ?? 0),
        output_tokens: Number(r?.usage_output_tokens ?? 0),
        model_used: String(r?.model ?? ''),
      });
    }
  }

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return rows;
};
