-- Open-tracking pixel token for lead_sent_emails (Gmail sends).
-- Run in Supabase SQL editor (idempotent).

ALTER TABLE lead_sent_emails
  ADD COLUMN IF NOT EXISTS open_tracking_token text;

CREATE UNIQUE INDEX IF NOT EXISTS lead_sent_emails_open_tracking_token_key
  ON lead_sent_emails (open_tracking_token)
  WHERE open_tracking_token IS NOT NULL;
