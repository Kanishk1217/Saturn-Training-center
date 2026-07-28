-- Run this once in Supabase → SQL Editor for the Saturn Training Centre project.

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text,
  location text,
  message text
);

alter table public.enquiries enable row level security;

-- Public site can insert enquiries, but cannot read them back.
-- View submissions from the Supabase Table Editor (uses your service role, bypasses RLS).
create policy "Public can submit enquiries"
  on public.enquiries
  for insert
  to anon
  with check (true);

-- ---------------------------------------------------------------------------
-- Email notification: fires the deployed `notify-enquiry` Edge Function
-- (Resend under the hood) on every new row. Uses the project's public anon
-- key just to satisfy the function's JWT check — that key is already public
-- in config.js, it grants no special access on its own.
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;

create or replace function public.notify_enquiry_webhook()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://cgtwyqgojmxcihbaufzg.supabase.co/functions/v1/notify-enquiry',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndHd5cWdvam14Y2loYmF1ZnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDc2OTQsImV4cCI6MjEwMDgyMzY5NH0.mRFcaubcm3DBFGSXH943vQS2uQGCsoQ-Z0SZ97JxYrs'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  return new;
end;
$$;

drop trigger if exists enquiries_notify_after_insert on public.enquiries;
create trigger enquiries_notify_after_insert
  after insert on public.enquiries
  for each row execute function public.notify_enquiry_webhook();
