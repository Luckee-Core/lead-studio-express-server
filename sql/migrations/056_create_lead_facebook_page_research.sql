ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS facebook_url TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_facebook_url ON public.leads (facebook_url)
  WHERE facebook_url IS NOT NULL AND trim(facebook_url) <> '';

CREATE TABLE IF NOT EXISTS public.lead_facebook_page_research (
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

CREATE INDEX IF NOT EXISTS idx_lead_facebook_page_research_lead_id
  ON public.lead_facebook_page_research (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_facebook_page_research_status
  ON public.lead_facebook_page_research (status);

CREATE OR REPLACE FUNCTION public.next_lead_id_for_facebook_page_research()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT l.id
  FROM public.leads l
  WHERE COALESCE(l.status, '') <> 'archived'
    AND l.facebook_url IS NOT NULL
    AND trim(l.facebook_url) <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.lead_facebook_page_research r
      WHERE r.lead_id = l.id AND r.status = 'succeeded'
    )
  ORDER BY l.created_at ASC
  LIMIT 1;
$$;
