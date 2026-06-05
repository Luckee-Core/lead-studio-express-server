-- Allow "in_call_log" for both lead and lead-contact statuses.
-- Handles both possible schemas:
-- 1) enum-backed status columns
-- 2) text + CHECK-backed status columns

DO $$
DECLARE
  leads_data_type text;
  leads_udt_name text;
  constraint_row RECORD;
BEGIN
  SELECT data_type, udt_name
  INTO leads_data_type, leads_udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'status';

  IF leads_data_type = 'USER-DEFINED' THEN
    BEGIN
      EXECUTE format(
        'ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L',
        leads_udt_name,
        'in_call_log'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  ELSE
    FOR constraint_row IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.leads'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
        AND pg_get_constraintdef(oid) ILIKE '%IN%'
    LOOP
      EXECUTE format('ALTER TABLE public.leads DROP CONSTRAINT %I', constraint_row.conname);
    END LOOP;

    ALTER TABLE public.leads
      ADD CONSTRAINT leads_status_check
      CHECK (
        status IN (
          'not_contacted',
          'not_answered',
          'contacted',
          'in_call_log',
          'lost',
          'archived'
        )
      );
  END IF;
END
$$;

DO $$
DECLARE
  lead_contacts_data_type text;
  lead_contacts_udt_name text;
  constraint_row RECORD;
BEGIN
  SELECT data_type, udt_name
  INTO lead_contacts_data_type, lead_contacts_udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lead_contacts'
    AND column_name = 'status';

  IF lead_contacts_data_type = 'USER-DEFINED' THEN
    BEGIN
      EXECUTE format(
        'ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L',
        lead_contacts_udt_name,
        'in_call_log'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  ELSE
    FOR constraint_row IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.lead_contacts'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
        AND pg_get_constraintdef(oid) ILIKE '%IN%'
    LOOP
      EXECUTE format('ALTER TABLE public.lead_contacts DROP CONSTRAINT %I', constraint_row.conname);
    END LOOP;

    ALTER TABLE public.lead_contacts
      ADD CONSTRAINT lead_contacts_status_check
      CHECK (
        status IN (
          'not_contacted',
          'contacted',
          'in_call_log',
          'responded',
          'not_responded',
          'won',
          'lost'
        )
      );
  END IF;
END
$$;
