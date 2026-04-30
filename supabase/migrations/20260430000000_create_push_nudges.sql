create table if not exists push_nudges (
  id          uuid        primary key default gen_random_uuid(),
  workflow_id text        not null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  cutoff_date date        not null,
  created_at  timestamptz not null default now(),
  constraint push_nudges_unique unique (workflow_id, user_id, cutoff_date)
);
