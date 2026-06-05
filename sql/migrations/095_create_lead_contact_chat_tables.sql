-- Lead Contact AI chat persistence (ICP-style lifecycle)

CREATE TABLE IF NOT EXISTS public.lead_contact_chat_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structured JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_contact_chat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  exchange_id UUID,
  response_id UUID REFERENCES public.lead_contact_chat_responses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_contact_chat_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.lead_contact_chat_requests(id) ON DELETE CASCADE,
  response_id UUID REFERENCES public.lead_contact_chat_responses(id) ON DELETE SET NULL,
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

ALTER TABLE public.lead_contact_chat_requests
  DROP CONSTRAINT IF EXISTS fk_lead_contact_chat_requests_exchange;

ALTER TABLE public.lead_contact_chat_requests
  ADD CONSTRAINT fk_lead_contact_chat_requests_exchange
  FOREIGN KEY (exchange_id)
  REFERENCES public.lead_contact_chat_exchanges(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lead_contact_chat_requests_contact
  ON public.lead_contact_chat_requests(lead_contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_contact_chat_exchanges_contact_created
  ON public.lead_contact_chat_exchanges(lead_contact_id, created_at);
