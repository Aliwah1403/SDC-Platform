-- Beta intake table (see BETA-DISTRIBUTION.md Part A).
-- Device census for the private /beta page. Written only by the beta-signup edge
-- function (service role); no public access. Multiple rows per email are allowed
-- by design — Curtis de-dupes by hand when sorting the two platform lists.

create table if not exists public.beta_signups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text not null,
  platform         text not null check (platform in ('ios', 'android')),
  google_email     text,
  device_model     text,
  founding_consent boolean not null default false,
  wishes           text,
  on_waitlist      boolean not null default false,
  created_at       timestamptz not null default now()
);

-- Curtis works two lists sorted by platform, and matches back to the waitlist by email.
create index if not exists beta_signups_platform_idx on public.beta_signups (platform);
create index if not exists beta_signups_email_idx on public.beta_signups (email);

-- Lock the table down: only the service role (edge function) may read/write it.
-- With RLS enabled and no policies, anon and authenticated clients are denied.
alter table public.beta_signups enable row level security;
