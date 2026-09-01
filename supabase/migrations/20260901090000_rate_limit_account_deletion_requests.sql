-- Throttle the unauthenticated deletion-request endpoint without retaining raw
-- email addresses or client IP addresses in the rate-limit table.
CREATE TABLE public.account_deletion_request_rate_limits (
  scope text NOT NULL CHECK (scope IN ('email', 'ip')),
  key_hash text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (scope, key_hash)
);

ALTER TABLE public.account_deletion_request_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_account_deletion_request_limit(
  p_scope text,
  p_key_hash text,
  p_max_requests integer,
  p_window interval DEFAULT interval '15 minutes'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  allowed boolean;
BEGIN
  IF p_scope NOT IN ('email', 'ip') OR p_max_requests < 1 OR p_window <= interval '0 seconds' THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  INSERT INTO public.account_deletion_request_rate_limits AS limits (
    scope,
    key_hash,
    window_started_at,
    request_count
  )
  VALUES (p_scope, p_key_hash, now(), 1)
  ON CONFLICT (scope, key_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= now() - p_window THEN now()
      ELSE limits.window_started_at
    END,
    request_count = CASE
      WHEN limits.window_started_at <= now() - p_window THEN 1
      ELSE limits.request_count + 1
    END
  RETURNING request_count <= p_max_requests INTO allowed;

  RETURN allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_account_deletion_request_limit(text, text, integer, interval)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_account_deletion_request_limit(text, text, integer, interval)
  TO service_role;
