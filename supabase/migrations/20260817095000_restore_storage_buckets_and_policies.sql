-- Restore Storage buckets and object policies that exist in production.
-- These are required for profile avatars and emergency contact photos in staging/local environments.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, null, null),
  ('contact-photos', 'contact-photos', true, null, null),
  ('medical-documents', 'medical-documents', false, null, null)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public avatar access'
  ) then
    create policy "Public avatar access"
      on storage.objects for select
      to public
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload their own avatar'
  ) then
    create policy "Users can upload their own avatar"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and (auth.uid())::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload own contact photos'
  ) then
    create policy "Users can upload own contact photos"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] = (auth.uid())::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can read own contact photos'
  ) then
    create policy "Users can read own contact photos"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] = (auth.uid())::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update own contact photos'
  ) then
    create policy "Users can update own contact photos"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] = (auth.uid())::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own contact photos'
  ) then
    create policy "Users can delete own contact photos"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] = (auth.uid())::text
      );
  end if;
end $$;
