-- Community activity pushes originate from a database trigger, not a signed-in
-- user. Authenticate the trigger with a dedicated secret instead of a public
-- anon JWT. The per-project URL and secret live in a private schema and are
-- provisioned outside source control.

create extension if not exists pg_net with schema extensions;

create schema if not exists private;

create table if not exists private.webhook_endpoints (
  name text primary key,
  url text not null,
  secret text not null,
  updated_at timestamptz not null default now()
);

revoke all on schema private from public;
revoke all on table private.webhook_endpoints from public;

create or replace function public.handle_community_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_secret text;
begin
  select url, secret
    into v_url, v_secret
    from private.webhook_endpoints
   where name = 'community_push';

  if v_url is null or v_secret is null then
    raise log 'COMMUNITY_PUSH_SKIPPED: community_push webhook endpoint not configured for notification %', new.id;
    return new;
  end if;

  begin
    perform net.http_post(
      url := v_url || '/functions/v1/send-community-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-community-push-secret', v_secret
      ),
      body := to_jsonb(new)
    );
  exception when others then
    raise log 'COMMUNITY_PUSH_SKIPPED: % for notification %', sqlerrm, new.id;
  end;

  return new;
end;
$$;
