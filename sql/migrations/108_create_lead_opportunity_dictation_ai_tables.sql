CREATE TABLE IF NOT EXISTS public.lead_opportunity_dictation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  exchange_id UUID,
  response_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_opportunity_dictation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structured JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_opportunity_dictation_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.lead_opportunity_dictation_requests(id) ON DELETE CASCADE,
  response_id UUID REFERENCES public.lead_opportunity_dictation_responses(id) ON DELETE SET NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  credits_used INTEGER DEFAULT 0,
  tokens_per_credit NUMERIC DEFAULT 11.11,
  model_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_opportunity_dictation_requests
  DROP CONSTRAINT IF EXISTS fk_lead_opportunity_dictation_requests_exchange;

ALTER TABLE public.lead_opportunity_dictation_requests
  ADD CONSTRAINT fk_lead_opportunity_dictation_requests_exchange
  FOREIGN KEY (exchange_id)
  REFERENCES public.lead_opportunity_dictation_exchanges(id)
  ON DELETE SET NULL;

ALTER TABLE public.lead_opportunity_dictation_requests
  DROP CONSTRAINT IF EXISTS fk_lead_opportunity_dictation_requests_response;

ALTER TABLE public.lead_opportunity_dictation_requests
  ADD CONSTRAINT fk_lead_opportunity_dictation_requests_response
  FOREIGN KEY (response_id)
  REFERENCES public.lead_opportunity_dictation_responses(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lead_opportunity_dictation_exchanges_user_created
  ON public.lead_opportunity_dictation_exchanges (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lead_opportunity_dictation_requests_user
  ON public.lead_opportunity_dictation_requests (user_id);
