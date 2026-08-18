
create table if not exists saved_facilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  place_id text not null,
  name text not null,
  type text,
  address text,
  phone text,
  lat float8,
  lng float8,
  rating float4,
  website text,
  scd_specialist boolean default false,
  saved_at timestamptz default now(),
  unique(user_id, place_id)
);

alter table saved_facilities enable row level security;

create policy "Users can manage their own saved facilities"
  on saved_facilities
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
;
