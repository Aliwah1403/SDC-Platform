create table if not exists public.export_notable_days (
  id uuid primary key default gen_random_uuid(),
  export_token_id uuid not null references public.export_tokens(id) on delete cascade,
  sort_order integer not null,
  date date not null,
  pain_level integer,
  hydration integer,
  symptoms text[] not null default '{}',
  triggers text[] not null default '{}',
  notes text,
  is_repaired boolean not null default false,
  created_at timestamptz not null default now(),
  unique (export_token_id, sort_order)
);

alter table public.export_notable_days enable row level security;

create index if not exists export_notable_days_token_order_idx
  on public.export_notable_days (export_token_id, sort_order);

create or replace function public.get_export_notable_days(
  p_token text,
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (
  date date,
  pain_level integer,
  hydration integer,
  symptoms text[],
  triggers text[],
  notes text,
  is_repaired boolean,
  sort_order integer,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with token_row as (
    select id
    from public.export_tokens
    where token = p_token
      and mode = 'full_export'
      and is_active = true
      and expires_at > now()
    limit 1
  ),
  matched as (
    select
      nd.date,
      nd.pain_level,
      nd.hydration,
      nd.symptoms,
      nd.triggers,
      nd.notes,
      nd.is_repaired,
      nd.sort_order
    from public.export_notable_days nd
    join token_row tr on tr.id = nd.export_token_id
  )
  select
    matched.date,
    matched.pain_level,
    matched.hydration,
    matched.symptoms,
    matched.triggers,
    matched.notes,
    matched.is_repaired,
    matched.sort_order,
    count(*) over () as total_count
  from matched
  order by matched.sort_order
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.get_export_notable_days(text, integer, integer) to anon;
grant select, insert, update, delete on table public.export_notable_days to service_role;
