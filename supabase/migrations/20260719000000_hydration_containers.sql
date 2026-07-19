-- Hydration containers: per-user saved quick-add vessels (Step 9 amendment,
-- 2026-07-19). Originally shipped device-local (AsyncStorage); moved to
-- Supabase so containers survive reinstalls and sync across a user's devices.

create table if not exists hydration_containers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  ml integer not null check (ml >= 100 and ml <= 2000),
  emoji text not null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hydration_containers_user_id_idx on hydration_containers (user_id);

-- At most one default per user, enforced atomically — see
-- set_default_hydration_container below for why the swap is a single UPDATE
-- rather than "unset old, set new" (which would transiently violate this).
create unique index if not exists hydration_containers_one_default_per_user
  on hydration_containers (user_id) where is_default;

alter table hydration_containers enable row level security;

create policy "Users can view their own hydration containers"
  on hydration_containers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own hydration containers"
  on hydration_containers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own hydration containers"
  on hydration_containers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own hydration containers"
  on hydration_containers for delete
  using (auth.uid() = user_id);

-- Makes exactly one container the caller's default in one statement, so the
-- unique index above is never violated by an intermediate "no default" state.
create or replace function set_default_hydration_container(p_container_id uuid)
returns void
language sql
security invoker
as $$
  update hydration_containers
  set is_default = (id = p_container_id), updated_at = now()
  where user_id = auth.uid();
$$;

-- Deletes a container for the calling user and, if it was the default,
-- promotes the next remaining container (lowest sort_order, then oldest) to
-- default — atomically, so "exactly one default" never has a gap. No-ops
-- (returns false) rather than deleting the caller's last container.
create or replace function remove_hydration_container(p_container_id uuid)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_was_default boolean;
  v_remaining_count int;
  v_promote_id uuid;
begin
  select count(*) into v_remaining_count from hydration_containers where user_id = auth.uid();
  if v_remaining_count <= 1 then
    return false;
  end if;

  select is_default into v_was_default from hydration_containers
    where id = p_container_id and user_id = auth.uid();

  delete from hydration_containers where id = p_container_id and user_id = auth.uid();

  if v_was_default then
    select id into v_promote_id from hydration_containers
      where user_id = auth.uid()
      order by sort_order asc, created_at asc
      limit 1;
    if v_promote_id is not null then
      update hydration_containers set is_default = true, updated_at = now() where id = v_promote_id;
    end if;
  end if;

  return true;
end;
$$;

-- Backfill: seed the 3 default containers for any already-onboarded profile
-- that has none yet — covers every account onboarded before this migration
-- (this feature previously stored containers on-device only). New accounts
-- get seeded going forward by completeOnboarding() in supabaseQueries.js.
insert into hydration_containers (user_id, name, ml, emoji, is_default, sort_order)
select p.user_id, v.name, v.ml, v.emoji, v.is_default, v.sort_order
from profiles p
cross join (values
  ('Glass', 250, '🥛', true, 0),
  ('Bottle', 500, '🍶', false, 1),
  ('Large', 1000, '🫙', false, 2)
) as v(name, ml, emoji, is_default, sort_order)
where p.onboarding_complete = true
  and not exists (
    select 1 from hydration_containers hc where hc.user_id = p.user_id
  );
