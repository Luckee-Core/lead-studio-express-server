-- Dedicated runs for manual/batch Facebook profile discovery via Google SERP + AI resolution.

CREATE TABLE IF NOT EXISTS public.facebook_google_search (
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

CREATE INDEX IF NOT EXISTS idx_facebook_google_search_lead_id
  ON public.facebook_google_search (lead_id);
CREATE INDEX IF NOT EXISTS idx_facebook_google_search_status
  ON public.facebook_google_search (status);

-- Link AI audit rows to Facebook SERP runs (research_run_id stays for Instagram/LinkedIn → lead_google_search_research).
ALTER TABLE public.lead_google_search_ai_requests
  ADD COLUMN IF NOT EXISTS facebook_google_search_run_id UUID REFERENCES public.facebook_google_search (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lgs_ai_requests_facebook_google_search_run_id
  ON public.lead_google_search_ai_requests (facebook_google_search_run_id);

ALTER TABLE public.lead_google_search_ai_exchanges
  ADD COLUMN IF NOT EXISTS facebook_google_search_run_id UUID REFERENCES public.facebook_google_search (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lgs_ai_exchanges_facebook_google_search_run_id
  ON public.lead_google_search_ai_exchanges (facebook_google_search_run_id);
