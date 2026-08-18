CREATE OR REPLACE FUNCTION trigger_waitlist_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://uphhntnjzfsckeuxjhco.supabase.co/functions/v1/waitlist-welcome',
    body    := jsonb_build_object(
                 'type',       TG_OP,
                 'table',      TG_TABLE_NAME,
                 'schema',     TG_TABLE_SCHEMA,
                 'record',     row_to_json(NEW),
                 'old_record', NULL
               ),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 -- Historical production webhook secret intentionally redacted.
                 'Authorization', 'Bearer LOCAL_ONLY_REDACTED'
               )
  );
  RETURN NEW;
END;
$$;;
