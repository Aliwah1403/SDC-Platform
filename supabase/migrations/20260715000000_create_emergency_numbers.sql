create table if not exists emergency_numbers (
  iso_country text        primary key,
  ambulance   text        not null,
  notes       text,
  updated_at  timestamptz not null default now()
);

alter table emergency_numbers enable row level security;

create policy "Public read access to emergency numbers"
  on emergency_numbers
  for select
  to anon, authenticated
  using (true);
