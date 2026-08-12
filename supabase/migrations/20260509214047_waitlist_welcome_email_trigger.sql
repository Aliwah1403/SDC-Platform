
-- This table existed in production before this migration was recorded, but its
-- original CREATE TABLE statement was not present in migration history. Keep
-- the reconstruction here so a clean local database can replay production's
-- history without creating a new migration version that looks pending remotely.
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'landing-page',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anonymous waitlist inserts"
  ON public.waitlist_signups;
CREATE POLICY "allow anonymous waitlist inserts"
  ON public.waitlist_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.trigger_waitlist_welcome_email()
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
                 -- Historical production authorization value intentionally redacted.
                 'Authorization', 'Bearer LOCAL_ONLY_REDACTED'
               )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_waitlist_signup_insert
AFTER INSERT ON public.waitlist_signups
FOR EACH ROW EXECUTE FUNCTION public.trigger_waitlist_welcome_email();
;
