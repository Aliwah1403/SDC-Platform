-- Restore Supabase API role privileges for clean environment rebuilds.
--
-- RLS policies still control row-level access. These grants only allow the
-- Supabase API roles to reach the tables/functions/sequences so RLS can be
-- evaluated. Without these privileges, PostgREST fails first with
-- "permission denied for table ..." on fresh staging/local projects.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public
to anon, authenticated, service_role;

grant all privileges on all sequences in schema public
to anon, authenticated, service_role;

grant all privileges on all functions in schema public
to anon, authenticated, service_role;

alter default privileges in schema public
grant all privileges on tables to anon, authenticated, service_role;

alter default privileges in schema public
grant all privileges on sequences to anon, authenticated, service_role;

alter default privileges in schema public
grant all privileges on functions to anon, authenticated, service_role;
