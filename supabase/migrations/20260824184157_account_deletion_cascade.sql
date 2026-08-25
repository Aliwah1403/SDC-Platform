-- An Auth-user deletion is the canonical account-deletion operation. Keep every
-- user-owned record attached with ON DELETE CASCADE so the Auth deletion removes
-- the data atomically instead of leaving an orphaned health record behind.
alter table public.saved_facilities
  drop constraint if exists saved_facilities_user_id_fkey;

alter table public.saved_facilities
  add constraint saved_facilities_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
