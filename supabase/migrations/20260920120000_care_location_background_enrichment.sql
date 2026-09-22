-- Track asynchronous, user-reviewable care-location enrichment separately
-- from the user-confirmed location fields.
ALTER TABLE public.saved_facilities
  ADD COLUMN IF NOT EXISTS enrichment_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS enrichment_suggestions jsonb,
  ADD COLUMN IF NOT EXISTS enrichment_request_id uuid,
  ADD COLUMN IF NOT EXISTS enrichment_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrichment_error_code text;

ALTER TABLE public.saved_facilities
  DROP CONSTRAINT IF EXISTS saved_facilities_enrichment_status_check,
  ADD CONSTRAINT saved_facilities_enrichment_status_check CHECK (
    enrichment_status IN (
      'not_requested',
      'pending',
      'processing',
      'suggestions_available',
      'no_match',
      'completed',
      'failed'
    )
  ),
  DROP CONSTRAINT IF EXISTS saved_facilities_enrichment_suggestions_check,
  ADD CONSTRAINT saved_facilities_enrichment_suggestions_check CHECK (
    enrichment_suggestions IS NULL OR (
      jsonb_typeof(enrichment_suggestions) = 'object' AND
      pg_column_size(enrichment_suggestions) <= 65536
    )
  ),
  DROP CONSTRAINT IF EXISTS saved_facilities_enrichment_attempt_count_check,
  ADD CONSTRAINT saved_facilities_enrichment_attempt_count_check
    CHECK (enrichment_attempt_count >= 0),
  DROP CONSTRAINT IF EXISTS saved_facilities_enrichment_error_code_check,
  ADD CONSTRAINT saved_facilities_enrichment_error_code_check
    CHECK (enrichment_error_code IS NULL OR char_length(enrichment_error_code) <= 100);

UPDATE public.saved_facilities
SET enrichment_status = 'completed',
    enrichment_completed_at = COALESCE(enrichment_completed_at, updated_at, saved_at)
WHERE geoapify_place_id IS NOT NULL
  AND enrichment_status = 'not_requested';

CREATE INDEX IF NOT EXISTS saved_facilities_enrichment_status_idx
  ON public.saved_facilities (enrichment_status, enrichment_requested_at)
  WHERE enrichment_status IN ('pending', 'processing', 'failed');

COMMENT ON COLUMN public.saved_facilities.enrichment_status IS
  'Lifecycle of optional background place enrichment; independent of save success.';
COMMENT ON COLUMN public.saved_facilities.enrichment_suggestions IS
  'Provider suggestions staged for explicit user review; never silently applied to confirmed fields.';
COMMENT ON COLUMN public.saved_facilities.enrichment_request_id IS
  'Token used to prevent stale or duplicate background runs from updating a newer request.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'saved_facilities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_facilities;
  END IF;
END
$$;
