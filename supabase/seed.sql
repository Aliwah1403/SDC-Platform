-- Local-only seed and safety overrides.
--
-- No production user or health data is copied. Reference education content is
-- seeded by the authoritative migration history. Users should create fresh
-- local accounts through the app or local Auth API.

-- Buckets that exist in SCD Project but were originally created outside the
-- recorded migration history. Storage objects themselves are intentionally not
-- copied.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('contact-photos', 'contact-photos', true),
  ('medical-documents', 'medical-documents', false)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public;

-- SCD Project predates Supabase's 2026 default that stopped automatically
-- exposing new public tables. Its existing tables have these grants and rely on
-- RLS for row authorization. Reproduce that legacy Data API access locally.
-- Before creating hosted staging, convert this into a reviewed, explicit
-- migration because new hosted projects use the newer revoked-by-default mode.
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;

-- Recreate the production policies that were created outside migrations.
drop policy if exists "Public avatar access" on storage.objects;
create policy "Public avatar access"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can read own contact photos" on storage.objects;
create policy "Users can read own contact photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'contact-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload own contact photos" on storage.objects;
create policy "Users can upload own contact photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'contact-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own contact photos" on storage.objects;
create policy "Users can update own contact photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'contact-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'contact-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own contact photos" on storage.objects;
create policy "Users can delete own contact photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'contact-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Safe mode: production's recorded history contains hardcoded production Edge
-- Function URLs in these two trigger functions. Local inserts must never send
-- email or push requests to production or third-party providers.
create or replace function public.handle_community_notification_push()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise log 'LOCAL_SAFE_MODE: suppressed community push for notification %', new.id;
  return new;
end;
$$;

create or replace function public.trigger_waitlist_welcome_email()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise log 'LOCAL_SAFE_MODE: suppressed waitlist welcome email for signup %', new.id;
  return new;
end;
$$;

revoke all on function public.handle_community_notification_push() from public, anon, authenticated;
revoke all on function public.trigger_waitlist_welcome_email() from public, anon, authenticated;
