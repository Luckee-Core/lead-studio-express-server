CREATE TABLE IF NOT EXISTS public.lead_dictation_notes_ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL,
  request_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_dictation_notes_ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lead_dictation_notes_ai_requests(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  raw_response TEXT,
  parsed_response_json JSONB,
  error_message TEXT,
  usage_input_tokens INTEGER,
  usage_output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_dictation_notes_ai_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.lead_dictation_notes_ai_requests(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES public.lead_dictation_notes_ai_responses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_dictation_notes_ai_requests_lead_created
  ON public.lead_dictation_notes_ai_requests (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_dictation_notes_ai_exchanges_lead_created
  ON public.lead_dictation_notes_ai_exchanges (lead_id, created_at DESC);
