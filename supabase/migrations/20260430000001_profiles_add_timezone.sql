alter table profiles
  add column if not exists timezone      text,
  add column if not exists timezone_auto boolean not null default true;
