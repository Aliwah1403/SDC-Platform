create table public.education_categories (
  slug text primary key,
  title text not null,
  description text,
  tint text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.education_articles (
  topic text primary key,
  category text not null references public.education_categories(slug),
  sort_order integer not null default 0,
  kicker text,
  title text not null,
  read_time integer,
  intro text,
  sections jsonb not null default '[]'::jsonb,
  callout jsonb,
  photo_url text,
  is_premium boolean not null default false,
  published boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index education_articles_category_idx on public.education_articles (category);

alter table public.education_categories enable row level security;
alter table public.education_articles enable row level security;

create policy "Public read access to education categories"
  on public.education_categories for select
  to anon, authenticated
  using (true);

create policy "Public read access to published education articles"
  on public.education_articles for select
  to anon, authenticated
  using (published = true);

create trigger set_education_categories_updated_at
  before update on public.education_categories
  for each row execute function public.handle_updated_at();

create trigger set_education_articles_updated_at
  before update on public.education_articles
  for each row execute function public.handle_updated_at();
;
