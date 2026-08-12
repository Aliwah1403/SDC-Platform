ALTER TABLE export_tokens
  ADD COLUMN first_viewed_at TIMESTAMPTZ NULL,
  DROP COLUMN IF EXISTS view_count;

CREATE OR REPLACE FUNCTION record_export_view(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE export_tokens
  SET first_viewed_at = NOW()
  WHERE token = p_token
    AND is_active = TRUE
    AND first_viewed_at IS NULL;
END;
$$;;
