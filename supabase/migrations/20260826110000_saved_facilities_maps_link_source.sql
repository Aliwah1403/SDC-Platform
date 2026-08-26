-- V1 Maps-link import metadata. No provider content is fetched or persisted.
alter table public.saved_facilities
  add column if not exists source_provider text,
  add column if not exists source_url text,
  add column if not exists provider_place_id text;

alter table public.saved_facilities
  drop constraint if exists saved_facilities_source_provider_check,
  add constraint saved_facilities_source_provider_check
    check (source_provider is null or source_provider in ('google_maps', 'apple_maps')),
  drop constraint if exists saved_facilities_source_url_check,
  add constraint saved_facilities_source_url_check
    check (
      source_url is null or (
        source_provider is not null and
        char_length(source_url) <= 2048 and
        source_url ~ '^https://'
      )
    ),
  drop constraint if exists saved_facilities_provider_place_id_check,
  add constraint saved_facilities_provider_place_id_check
    check (provider_place_id is null or (source_provider is not null and char_length(provider_place_id) <= 500));

comment on column public.saved_facilities.source_provider is
  'Map-link provider selected by the user; not a clinical verification source.';
comment on column public.saved_facilities.source_url is
  'Validated Google/Apple Maps URL supplied by the user.';
comment on column public.saved_facilities.provider_place_id is
  'Optional provider identifier parsed from a user-supplied Maps URL; never the Hemo primary key.';
