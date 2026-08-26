-- V1 Care locations: preserve legacy rows while adding user-owned care roles.
alter table public.saved_facilities
  add column if not exists role text,
  add column if not exists source_kind text,
  add column if not exists directory_facility_id uuid,
  add column if not exists care_team_phone text,
  add column if not exists notes text,
  add column if not exists country_code text,
  add column if not exists updated_at timestamptz not null default now();

update public.saved_facilities
set role = 'other'
where role is null;

update public.saved_facilities
set source_kind = 'legacy_google'
where source_kind is null;

alter table public.saved_facilities
  alter column role set default 'other',
  alter column role set not null,
  alter column source_kind set default 'user',
  alter column source_kind set not null;

alter table public.saved_facilities
  drop constraint if exists saved_facilities_role_check,
  add constraint saved_facilities_role_check
    check (role in ('preferred_ed', 'regular_scd_clinic', 'pharmacy', 'transfusion_centre', 'other')),
  drop constraint if exists saved_facilities_source_kind_check,
  add constraint saved_facilities_source_kind_check
    check (source_kind in ('user', 'verified_directory', 'legacy_google'));

create unique index if not exists saved_facilities_one_preferred_ed_per_user
  on public.saved_facilities (user_id)
  where role = 'preferred_ed';

create unique index if not exists saved_facilities_one_regular_clinic_per_user
  on public.saved_facilities (user_id)
  where role = 'regular_scd_clinic';

create or replace function public.set_care_location_role(
  p_location_id uuid,
  p_role text
)
returns public.saved_facilities
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_location public.saved_facilities;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_role not in ('preferred_ed', 'regular_scd_clinic', 'pharmacy', 'transfusion_centre', 'other') then
    raise exception 'Invalid care location role';
  end if;

  if p_role in ('preferred_ed', 'regular_scd_clinic') then
    update public.saved_facilities
    set role = 'other', updated_at = now()
    where user_id = v_user_id
      and role = p_role
      and id <> p_location_id;
  end if;

  update public.saved_facilities
  set role = p_role, updated_at = now()
  where id = p_location_id and user_id = v_user_id
  returning * into v_location;

  if v_location.id is null then
    raise exception 'Care location not found';
  end if;

  return v_location;
end;
$$;

revoke all on function public.set_care_location_role(uuid, text) from public;
grant execute on function public.set_care_location_role(uuid, text) to authenticated;
