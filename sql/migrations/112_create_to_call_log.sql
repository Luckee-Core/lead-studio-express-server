-- Tracks leads/contacts intentionally queued for phone outreach.
create table if not exists public.to_call_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  lead_contact_id uuid not null references public.lead_contacts(id) on delete cascade,
  lead_contact_email_queue_id uuid null references public.lead_contact_email_queue(id) on delete set null,
  notes text not null,
  call_status text not null default 'queued',
  called_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint to_call_log_call_status_check check (call_status in ('queued', 'called', 'skipped'))
);

create index if not exists idx_to_call_log_lead_id on public.to_call_log(lead_id);
create index if not exists idx_to_call_log_lead_contact_id on public.to_call_log(lead_contact_id);
create index if not exists idx_to_call_log_queue_id on public.to_call_log(lead_contact_email_queue_id);
create index if not exists idx_to_call_log_created_at on public.to_call_log(created_at desc);
