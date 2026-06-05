-- Request/response/exchange audit for lead Facebook posts AI (e.g. activity score from Anthropic).

CREATE TABLE IF NOT EXISTS public.lead_facebook_posts_ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  posts_research_run_id UUID REFERENCES public.lead_facebook_posts_research (id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL,
  request_payload_json JSONB NOT NULL,
  system_prompt TEXT NOT NULL,
  user_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lfp_ai_requests_lead_id
  ON public.lead_facebook_posts_ai_requests (lead_id);
CREATE INDEX IF NOT EXISTS idx_lfp_ai_requests_posts_research_run_id
  ON public.lead_facebook_posts_ai_requests (posts_research_run_id);

CREATE TABLE IF NOT EXISTS public.lead_facebook_posts_ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lead_facebook_posts_ai_requests (id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  raw_response TEXT,
  parsed_response_json JSONB,
  error_message TEXT,
  usage_input_tokens INTEGER,
  usage_output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lfp_ai_responses_request_id
  ON public.lead_facebook_posts_ai_responses (request_id);

CREATE TABLE IF NOT EXISTS public.lead_facebook_posts_ai_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  posts_research_run_id UUID REFERENCES public.lead_facebook_posts_research (id) ON DELETE SET NULL,
  request_id UUID NOT NULL REFERENCES public.lead_facebook_posts_ai_requests (id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES public.lead_facebook_posts_ai_responses (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lfp_ai_exchanges_lead_id
  ON public.lead_facebook_posts_ai_exchanges (lead_id);
CREATE INDEX IF NOT EXISTS idx_lfp_ai_exchanges_posts_research_run_id
  ON public.lead_facebook_posts_ai_exchanges (posts_research_run_id);
