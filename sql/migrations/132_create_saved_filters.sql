-- Per-user named leads list filter presets (JSON payload mirrors luckee-web `PersistedLeadsFilters`).

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id_updated_at ON public.saved_filters (user_id, updated_at DESC);

COMMENT ON TABLE public.saved_filters IS 'Named leads table filter sets per user; `filters` stores the full filter state JSON.';
