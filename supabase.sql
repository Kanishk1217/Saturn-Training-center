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
