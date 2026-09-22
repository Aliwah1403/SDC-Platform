-- Shared cache for normalized Geoapify provider results. Cache keys are salted
-- hashes; original Maps URLs, user identifiers, and raw request text are never
-- stored here. Geoapify permits result storage, subject to source attribution.
CREATE TABLE IF NOT EXISTS public.geoapify_enrichment_cache (
  cache_key text PRIMARY KEY CHECK (char_length(cache_key) = 64),
  payload jsonb NOT NULL CHECK (
    jsonb_typeof(payload) = 'object' AND
    pg_column_size(payload) <= 65536
  ),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS geoapify_enrichment_cache_expires_at_idx
  ON public.geoapify_enrichment_cache (expires_at);

ALTER TABLE public.geoapify_enrichment_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.geoapify_enrichment_cache FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.geoapify_enrichment_cache TO service_role;

COMMENT ON TABLE public.geoapify_enrichment_cache IS
  'Server-only normalized Geoapify results. Requires visible Geoapify/OpenStreetMap attribution when reused.';
