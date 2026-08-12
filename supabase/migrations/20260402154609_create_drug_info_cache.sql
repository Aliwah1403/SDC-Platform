CREATE TABLE drug_info_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_name text UNIQUE NOT NULL,
  rxcui text,
  description text,
  indications text,
  side_effects text,
  warnings text,
  mechanism text,
  drug_interactions text,
  dose_form text,
  brand_names text,
  fetched_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE drug_info_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read drug info"
  ON drug_info_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert drug info"
  ON drug_info_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update drug info"
  ON drug_info_cache FOR UPDATE TO authenticated USING (true);;
