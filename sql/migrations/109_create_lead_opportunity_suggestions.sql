-- Per-lead opportunity rows from dictation (linked to catalog services + audit trail).

CREATE TABLE IF NOT EXISTS public.lead_opportunity_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  dictation_request_id UUID NOT NULL REFERENCES public.lead_opportunity_dictation_requests(id) ON DELETE CASCADE,
  exchange_id UUID REFERENCES public.lead_opportunity_dictation_exchanges(id) ON DELETE SET NULL,
  source_suggestion_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  match_type TEXT NOT NULL CHECK (match_type IN ('existing', 'new')),
  linked_offered_service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'accepted', 'dismissed')),
  created_offered_service_id UUID REFERENCES public.offered_service(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dictation_request_id, source_suggestion_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_opportunity_suggestions_lead_created
  ON public.lead_opportunity_suggestions (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_opportunity_suggestions_user
  ON public.lead_opportunity_suggestions (user_id);
