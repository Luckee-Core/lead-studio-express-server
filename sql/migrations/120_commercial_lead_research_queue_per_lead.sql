-- One queue row per lead; worker runs full research per row. Replaces 119 four-step batch shape.

DROP TABLE IF EXISTS public.commercial_lead_research_queue CASCADE;

CREATE TABLE public.commercial_lead_research_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commercial_lead_research_queue_status_scheduled
  ON public.commercial_lead_research_queue (status, scheduled_at);

CREATE INDEX idx_commercial_lead_research_queue_batch
  ON public.commercial_lead_research_queue (batch_id);

CREATE INDEX idx_commercial_lead_research_queue_lead_id
  ON public.commercial_lead_research_queue (lead_id);

CREATE INDEX idx_commercial_lead_research_queue_processing
  ON public.commercial_lead_research_queue (status)
  WHERE status = 'processing';
