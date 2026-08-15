create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table contact_submissions enable row level security;

create policy "Anyone can submit contact form"
  on contact_submissions for insert
  to anon
  with check (true);;
