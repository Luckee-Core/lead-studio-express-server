-- Leads (CRM) — required before website_scrape_runs.lead_id FK.
-- category_id is optional UUID without FK here (lead_categories lives outside this bootstrap).

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255),
  business_phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  has_quote_form BOOLEAN NOT NULL DEFAULT FALSE,
  has_chat_bot BOOLEAN NOT NULL DEFAULT FALSE,
  has_phone_quote BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (status IN ('not_contacted', 'not_answered', 'contacted', 'lost', 'archived')),
  archive_reason TEXT,
  idempotency_key VARCHAR(255) NOT NULL,
  search_run_id UUID,
  category_id UUID,
  category_name VARCHAR(255),
  quality_score INTEGER CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_category_id ON public.leads (category_id);
CREATE INDEX IF NOT EXISTS idx_leads_search_run_id ON public.leads (search_run_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_idempotency_key_unique ON public.leads (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_business_name ON public.leads (business_name);
CREATE INDEX IF NOT EXISTS idx_leads_website ON public.leads (website);
