
CREATE OR REPLACE FUNCTION public.handle_community_notification_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM net.http_post(
    url     := 'https://uphhntnjzfsckeuxjhco.supabase.co/functions/v1/send-community-push',
    -- Historical production authorization value intentionally redacted from source control.
    -- seed.sql replaces this function with a local no-op before local testing begins.
    headers := '{"Content-Type":"application/json","Authorization":"Bearer LOCAL_ONLY_REDACTED"}'::jsonb,
    body    := to_jsonb(NEW)
  );
  RETURN NEW;
END;
$function$;
;
