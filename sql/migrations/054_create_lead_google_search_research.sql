-- Lead Google Search research runs (SERP / URL discovery), one global active lock via status=active row.

CREATE TABLE IF NOT EXISTS public.lead_google_search_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'succeeded', 'failed')),
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_google_search_research_lead_id
  ON public.lead_google_search_research (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_google_search_research_status
  ON public.lead_google_search_research (status);

CREATE OR REPLACE FUNCTION public.next_lead_id_for_google_search_research()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT l.id
  FROM public.leads l
  WHERE COALESCE(l.status, '') <> 'archived'
    AND NOT EXISTS (
      SELECT 1 FROM public.lead_google_search_research r
      WHERE r.lead_id = l.id AND r.status = 'succeeded'
    )
  ORDER BY l.created_at ASC
  LIMIT 1;
$$;
