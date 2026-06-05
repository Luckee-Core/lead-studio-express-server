-- google_maps_scrape_runs (luckee-web Find Leads / Google Maps scrape)
CREATE TABLE IF NOT EXISTS public.google_maps_scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  results_count INTEGER NOT NULL DEFAULT 0,
  businesses_imported INTEGER NOT NULL DEFAULT 0,
  max_results INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  duration INTEGER
);

CREATE INDEX IF NOT EXISTS idx_google_maps_scrape_runs_created_at
  ON public.google_maps_scrape_runs(created_at DESC);
