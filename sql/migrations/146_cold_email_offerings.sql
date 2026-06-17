-- Cold email offerings catalog + sent-email junction; replaces offered_service.

CREATE TABLE IF NOT EXISTS public.cold_email_offering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  source_notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cold_email_offering_user_sort
  ON public.cold_email_offering (user_id, sort_order, created_at);

ALTER TABLE public.cold_email_offering ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY cold_email_offering_isolation ON public.cold_email_offering
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.cold_email_offering IS 'Outcome-focused cold outreach angles for local business email.';

-- Draft compose: optional offering selection
ALTER TABLE public.lead_contact_emails
  ADD COLUMN IF NOT EXISTS cold_email_offering_id UUID REFERENCES public.cold_email_offering(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lead_contact_emails_cold_email_offering_id
  ON public.lead_contact_emails (cold_email_offering_id)
  WHERE cold_email_offering_id IS NOT NULL;

-- Junction: which offering was used when an email was sent
CREATE TABLE IF NOT EXISTS public.lead_sent_email_cold_email_offering (
  lead_sent_email_id UUID PRIMARY KEY REFERENCES public.lead_sent_emails(id) ON DELETE CASCADE,
  cold_email_offering_id UUID NOT NULL REFERENCES public.cold_email_offering(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_sent_email_cold_email_offering_offering_id
  ON public.lead_sent_email_cold_email_offering (cold_email_offering_id);

COMMENT ON TABLE public.lead_sent_email_cold_email_offering IS 'Links sent emails to the cold email offering used at send time.';

-- Migrate offered_service rows if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'offered_service'
  ) THEN
    INSERT INTO public.cold_email_offering (
      id, user_id, title, hook, description, source_notes, sort_order, is_archived, created_at, updated_at
    )
    SELECT
      id,
      user_id,
      title,
      '',
      description,
      '',
      sort_order,
      FALSE,
      created_at,
      updated_at
    FROM public.offered_service
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Repoint lead_opportunity_suggestions columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_opportunity_suggestions'
      AND column_name = 'linked_offered_service_ids'
  ) THEN
    ALTER TABLE public.lead_opportunity_suggestions
      RENAME COLUMN linked_offered_service_ids TO linked_cold_email_offering_ids;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_opportunity_suggestions'
      AND column_name = 'created_offered_service_id'
  ) THEN
    ALTER TABLE public.lead_opportunity_suggestions
      DROP CONSTRAINT IF EXISTS lead_opportunity_suggestions_created_offered_service_id_fkey;

    ALTER TABLE public.lead_opportunity_suggestions
      RENAME COLUMN created_offered_service_id TO created_cold_email_offering_id;

    ALTER TABLE public.lead_opportunity_suggestions
      ADD CONSTRAINT lead_opportunity_suggestions_created_cold_email_offering_id_fkey
      FOREIGN KEY (created_cold_email_offering_id)
      REFERENCES public.cold_email_offering(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop legacy Services Studio tables
DROP TABLE IF EXISTS public.services_studio_chat_message CASCADE;
DROP TABLE IF EXISTS public.offered_service CASCADE;
