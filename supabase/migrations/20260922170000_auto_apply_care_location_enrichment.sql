-- Apply verified background contact enrichment without overwriting details the
-- user entered while the job was running.
CREATE OR REPLACE FUNCTION public.apply_care_location_enrichment(
  p_location_id uuid,
  p_user_id uuid,
  p_request_id uuid,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_provenance jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_location public.saved_facilities%ROWTYPE;
  v_apply_phone boolean := false;
  v_apply_website boolean := false;
BEGIN
  SELECT *
  INTO v_location
  FROM public.saved_facilities
  WHERE id = p_location_id
    AND user_id = p_user_id
    AND enrichment_request_id = p_request_id
    AND enrichment_status IN ('pending', 'processing')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'stale');
  END IF;

  v_apply_phone := NULLIF(BTRIM(v_location.phone), '') IS NULL
    AND NULLIF(BTRIM(p_phone), '') IS NOT NULL;
  v_apply_website := NULLIF(BTRIM(v_location.website), '') IS NULL
    AND NULLIF(BTRIM(p_website), '') IS NOT NULL;

  UPDATE public.saved_facilities
  SET phone = CASE WHEN v_apply_phone THEN BTRIM(p_phone) ELSE phone END,
      website = CASE WHEN v_apply_website THEN BTRIM(p_website) ELSE website END,
      enrichment_provenance = CASE
        WHEN (v_apply_phone OR v_apply_website) AND p_provenance IS NOT NULL
          THEN jsonb_set(
            COALESCE(enrichment_provenance, '{"version": 1}'::jsonb),
            '{backgroundEnrichment}',
            p_provenance,
            true
          )
        ELSE enrichment_provenance
      END,
      enrichment_status = 'completed',
      enrichment_suggestions = NULL,
      enrichment_completed_at = now(),
      enrichment_error_code = NULL,
      updated_at = CASE WHEN v_apply_phone OR v_apply_website THEN now() ELSE updated_at END
  WHERE id = p_location_id;

  RETURN jsonb_build_object(
    'status', 'completed',
    'appliedPhone', v_apply_phone,
    'appliedWebsite', v_apply_website
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_care_location_enrichment(uuid, uuid, uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_care_location_enrichment(uuid, uuid, uuid, text, text, jsonb)
  TO service_role;

-- Complete any result staged by the previous review flow. Only blank contact
-- fields are populated, preserving values users already entered.
UPDATE public.saved_facilities
SET phone = CASE
      WHEN NULLIF(BTRIM(phone), '') IS NULL
        THEN NULLIF(BTRIM(enrichment_suggestions #>> '{fields,phone,value}'), '')
      ELSE phone
    END,
    website = CASE
      WHEN NULLIF(BTRIM(website), '') IS NULL
        THEN NULLIF(BTRIM(enrichment_suggestions #>> '{fields,website,value}'), '')
      ELSE website
    END,
    enrichment_provenance = jsonb_set(
      COALESCE(enrichment_provenance, '{"version": 1}'::jsonb),
      '{backgroundEnrichment}',
      jsonb_build_object(
        'mode', 'automatic_missing_fields',
        'migratedFromReviewQueue', true,
        'enrichedAt', now(),
        'fields', COALESCE(enrichment_suggestions -> 'fields', '{}'::jsonb),
        'groundedResult', enrichment_suggestions -> 'groundedResult'
      ),
      true
    ),
    enrichment_status = 'completed',
    enrichment_suggestions = NULL,
    enrichment_completed_at = COALESCE(enrichment_completed_at, now()),
    enrichment_error_code = NULL,
    updated_at = now()
WHERE enrichment_status = 'suggestions_available';

COMMENT ON COLUMN public.saved_facilities.enrichment_suggestions IS
  'Legacy review payload. New verified background enrichment is atomically applied only to blank contact fields.';
COMMENT ON COLUMN public.saved_facilities.enrichment_provenance IS
  'Maps and enrichment field provenance. Provider identity evidence is not clinical verification.';

NOTIFY pgrst, 'reload schema';
