-- Attachments for lead_contact_emails (PDF/PNG/JPG, storage path in bucket).
-- Safe to run if types/table already exist (e.g. from luckee_open_source_public_schema).

DO $$
BEGIN
  CREATE TYPE public.email_attachment_type AS ENUM ('pdf', 'png', 'jpg');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.lead_contact_email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_contact_email_id UUID NOT NULL REFERENCES public.lead_contact_emails(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type public.email_attachment_type NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_lead_contact_email_attachments_file_size CHECK (file_size_bytes <= 5242880)
);

CREATE INDEX IF NOT EXISTS idx_lead_contact_email_attachments_email_id
  ON public.lead_contact_email_attachments(lead_contact_email_id);
