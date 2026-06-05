-- Website scrape runs (lead website scraping via n8n webhook)
DO $$
BEGIN
  CREATE TYPE website_scrape_run_status AS ENUM (
    'pending',
    'active',
    'completed',
    'failed',
    'timeout'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS website_scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  website VARCHAR(512) NOT NULL,
  status website_scrape_run_status NOT NULL DEFAULT 'pending',
  scraped_data JSONB,
  cost_cents INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_scrape_runs_lead_id ON website_scrape_runs (lead_id);
CREATE INDEX IF NOT EXISTS idx_website_scrape_runs_started_at ON website_scrape_runs (started_at DESC);
