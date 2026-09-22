-- Preserve deterministic place-enrichment evidence without treating provider
-- data as proof that a facility offers sickle-cell or haematology care.
ALTER TABLE public.saved_facilities
  ADD COLUMN IF NOT EXISTS geoapify_place_id text,
  ADD COLUMN IF NOT EXISTS enrichment_provenance jsonb;

ALTER TABLE public.saved_facilities
  DROP CONSTRAINT IF EXISTS saved_facilities_geoapify_place_id_check,
  ADD CONSTRAINT saved_facilities_geoapify_place_id_check
    CHECK (geoapify_place_id IS NULL OR char_length(geoapify_place_id) <= 500),
  DROP CONSTRAINT IF EXISTS saved_facilities_enrichment_provenance_check,
  ADD CONSTRAINT saved_facilities_enrichment_provenance_check
    CHECK (
      enrichment_provenance IS NULL OR (
        jsonb_typeof(enrichment_provenance) = 'object' AND
        enrichment_provenance ->> 'version' = '1'
      )
    );

COMMENT ON COLUMN public.saved_facilities.geoapify_place_id IS
  'Geoapify identifier selected during user-reviewed place enrichment; not a Google/Apple identifier.';
COMMENT ON COLUMN public.saved_facilities.enrichment_provenance IS
  'User-reviewed field provenance and correction metadata. This is place identity evidence, not clinical verification.';
