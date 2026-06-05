-- Tables referenced by lead-studio-express-server but missing CREATE migrations in mentorai-server.
-- Run after 034/034b (leads, lead_contacts) and before 076, 112, 145.

-- Lead categories (CRM taxonomy)
CREATE TABLE IF NOT EXISTS public.lead_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  leads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_categories_normalized_name
  ON public.lead_categories (normalized_name);

-- Draft emails per contact
CREATE TABLE IF NOT EXISTS public.lead_contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  campaign_ids UUID[] NOT NULL DEFAULT '{}',
  variation_id INTEGER,
  email_sending_identity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contact_emails_lead_id ON public.lead_contact_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contact_emails_contact_id ON public.lead_contact_emails(lead_contact_id);

-- Sent email log
CREATE TABLE IF NOT EXISTS public.lead_sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email_id UUID NOT NULL REFERENCES public.lead_contact_emails(id) ON DELETE CASCADE,
  lead_contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  persona_id UUID,
  campaign_id UUID,
  campaign_email_variation_id UUID,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_name TEXT,
  from_email TEXT,
  email_sending_identity_id UUID,
  variation_id INTEGER,
  sg_message_id TEXT,
  open_tracking_token TEXT,
  opened_at TIMESTAMPTZ,
  opened_count INTEGER DEFAULT 0,
  delivery_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_sent_emails_contact_id ON public.lead_sent_emails(lead_contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_sent_emails_sent_at ON public.lead_sent_emails(sent_at DESC);

-- Outbound queue
DO $$ BEGIN
  CREATE TYPE public.lead_contact_email_queue_status AS ENUM (
    'queued', 'sending', 'sent', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_contact_email_queue_type AS ENUM ('custom_email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.lead_contact_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_contact_id UUID NOT NULL REFERENCES public.lead_contacts(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  persona_id UUID,
  campaign_id UUID,
  type public.lead_contact_email_queue_type NOT NULL DEFAULT 'custom_email',
  lead_contact_email_id UUID REFERENCES public.lead_contact_emails(id) ON DELETE SET NULL,
  status public.lead_contact_email_queue_status NOT NULL DEFAULT 'queued',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contact_email_queue_status_scheduled
  ON public.lead_contact_email_queue(status, scheduled_at);

-- Campaign variations (optional; referenced by sent emails)
CREATE TABLE IF NOT EXISTS public.campaign_email_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  variation_index INTEGER NOT NULL DEFAULT 0,
  subject TEXT,
  body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gmail push watch state (optional email feature)
CREATE TABLE IF NOT EXISTS public.gmail_watch_state (
  email_address TEXT PRIMARY KEY,
  history_id TEXT,
  expiration_ms BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stub for persona_id columns when Email Persona Studio is not installed
CREATE TABLE IF NOT EXISTS public.email_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
