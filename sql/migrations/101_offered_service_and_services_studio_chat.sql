-- Services Studio: catalog rows per user + chat messages for refining offerings (cold outreach).

CREATE TABLE IF NOT EXISTS public.offered_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offered_service_user_sort
  ON public.offered_service (user_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS public.services_studio_chat_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_studio_chat_user_created
  ON public.services_studio_chat_message (user_id, created_at);

ALTER TABLE public.offered_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_studio_chat_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY offered_service_isolation ON public.offered_service
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY services_studio_chat_isolation ON public.services_studio_chat_message
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

COMMENT ON TABLE public.offered_service IS 'User-defined services for AI cold-outreach matching (text only, no pricing).';
COMMENT ON TABLE public.services_studio_chat_message IS 'Services Studio coach thread per user.';
