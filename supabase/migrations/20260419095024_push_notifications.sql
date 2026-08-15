
-- Push tokens: one row per user, updated on each login
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz default now()
);

alter table push_tokens enable row level security;

create policy "users manage own push token"
  on push_tokens for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- System notifications: server-driven health/reminder notifications
create table if not exists system_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

alter table system_notifications enable row level security;

create policy "users read own system notifications"
  on system_notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users update own system notifications"
  on system_notifications for update
  to authenticated
  using (auth.uid() = user_id);

create index if not exists system_notifications_user_created
  on system_notifications (user_id, created_at desc);
;
