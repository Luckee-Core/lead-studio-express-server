-- Email sending identities: map UI "From" mailboxes to env-backed Workspace addresses (domain-wide delegation).

CREATE TABLE IF NOT EXISTS public.email_sending_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  from_email TEXT NOT NULL,
  send_as_env_key TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sending_identities_sort_order
  ON public.email_sending_identities (sort_order);

COMMENT ON TABLE public.email_sending_identities IS
  'Outbound mailbox options; send_as_env_key names a server env var whose value is the Gmail impersonation address.';

ALTER TABLE public.lead_contact_emails
  ADD COLUMN IF NOT EXISTS email_sending_identity_id UUID REFERENCES public.email_sending_identities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lead_contact_emails_email_sending_identity_id
  ON public.lead_contact_emails (email_sending_identity_id);

ALTER TABLE public.lead_sent_emails
  ADD COLUMN IF NOT EXISTS email_sending_identity_id UUID REFERENCES public.email_sending_identities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS from_email TEXT;

CREATE INDEX IF NOT EXISTS idx_lead_sent_emails_email_sending_identity_id
  ON public.lead_sent_emails (email_sending_identity_id);

-- Seed two identities; operators set GMAIL_SEND_AS_TROUT_HOUSE and GMAIL_SEND_AS_PHILLY_AI in server env.
INSERT INTO public.email_sending_identities (label, from_email, send_as_env_key, sort_order)
VALUES
  ('Trout House Tech', 'matt@trouthousetech.com', 'GMAIL_SEND_AS_TROUT_HOUSE', 0),
  ('Philly AI Consulting', 'matt@phillyaiconsulting.com', 'GMAIL_SEND_AS_PHILLY_AI', 1)
ON CONFLICT (send_as_env_key) DO NOTHING;
