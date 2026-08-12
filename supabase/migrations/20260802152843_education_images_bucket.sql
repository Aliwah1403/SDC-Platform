insert into storage.buckets (id, name, public)
values ('education-images', 'education-images', true)
on conflict (id) do nothing;

create policy "Public education image access"
on storage.objects for select
using (bucket_id = 'education-images');
;
