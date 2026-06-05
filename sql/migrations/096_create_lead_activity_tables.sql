CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'lead_opened' CHECK (activity_type IN ('lead_opened')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at
  ON public.lead_activities (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activities_customer_id_created_at
  ON public.lead_activities (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id_created_at
  ON public.lead_activities (lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lead_contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'lead_contact_opened' CHECK (activity_type IN ('lead_contact_opened')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contact_activities_created_at
  ON public.lead_contact_activities (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_contact_activities_customer_id_created_at
  ON public.lead_contact_activities (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_contact_activities_contact_id_created_at
  ON public.lead_contact_activities (lead_contact_id, created_at DESC);
