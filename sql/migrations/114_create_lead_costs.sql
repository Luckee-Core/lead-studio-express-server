-- Manual / AI ledger line items for lead CAC (separate from derived AI exchange token costs).

CREATE TABLE IF NOT EXISTS public.lead_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0),
  entry_source TEXT NOT NULL DEFAULT 'user' CHECK (entry_source IN ('user', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_costs_lead_created
  ON public.lead_costs (lead_id, created_at DESC);

ALTER TABLE public.lead_costs
  ADD COLUMN IF NOT EXISTS entry_source TEXT NOT NULL DEFAULT 'user';
