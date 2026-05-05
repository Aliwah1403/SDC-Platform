alter table profiles
  add column if not exists location_enabled boolean not null default false;
