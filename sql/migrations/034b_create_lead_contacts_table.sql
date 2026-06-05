-- Lead contacts (one lead -> many contacts). Must run after public.leads exists.
-- Referenced by 070, 095, 096, 112, 113, 129, etc.

CREATE TABLE IF NOT EXISTS public.lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(255),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'not_contacted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead_id ON public.lead_contacts (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_created_at ON public.lead_contacts (created_at DESC);

COMMENT ON TABLE public.lead_contacts IS 'People associated with a CRM lead';
