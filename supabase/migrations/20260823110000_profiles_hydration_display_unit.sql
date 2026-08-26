-- The hydration display unit was originally device-local. Persisting it lets
-- server-side notifications use the measurement unit the person chose.
alter table public.profiles
  add column if not exists hydration_display_unit text not null default 'glasses'
  check (hydration_display_unit in ('glasses', 'ml', 'L', 'floz'));
