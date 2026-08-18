-- Keep community likes/comments from failing if asynchronous push delivery is
-- unavailable or misconfigured in a non-production environment.
--
-- Project-specific values should be configured outside source control:
--   alter database postgres set app.supabase_url = 'https://<project-ref>.supabase.co';
--   alter database postgres set app.anon_key = '<public anon key>';

create extension if not exists pg_net with schema extensions;

create or replace function public.handle_community_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_anon text;
begin
  v_url := nullif(current_setting('app.supabase_url', true), '');
  v_anon := nullif(current_setting('app.anon_key', true), '');

  if v_url is null or v_anon is null then
    raise log 'COMMUNITY_PUSH_SKIPPED: app.supabase_url/app.anon_key not configured for notification %', new.id;
    return new;
  end if;

  begin
    perform net.http_post(
      url := v_url || '/functions/v1/send-community-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon
      ),
      body := to_jsonb(new)
    );
  exception when others then
    raise log 'COMMUNITY_PUSH_SKIPPED: % for notification %', sqlerrm, new.id;
  end;

  return new;
end;
$$;
