-- One row per lead for Playwright nav/footer same-domain URL discovery (manual one-shot).

CREATE TABLE IF NOT EXISTS public.lead_playwright_website_url_discovery (
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

CREATE INDEX IF NOT EXISTS idx_lead_playwright_website_url_discovery_lead_id
  ON public.lead_playwright_website_url_discovery (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_playwright_website_url_discovery_status
  ON public.lead_playwright_website_url_discovery (status);
