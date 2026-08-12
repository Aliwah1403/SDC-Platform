
ALTER TABLE drug_info_cache
  ADD COLUMN IF NOT EXISTS common_name text,
  ADD COLUMN IF NOT EXISTS humanized_indications text,
  ADD COLUMN IF NOT EXISTS humanized_mechanism text,
  ADD COLUMN IF NOT EXISTS humanized_side_effects text,
  ADD COLUMN IF NOT EXISTS humanized_warnings text,
  ADD COLUMN IF NOT EXISTS humanized_interactions text,
  ADD COLUMN IF NOT EXISTS scd_contraindication jsonb,
  ADD COLUMN IF NOT EXISTS humanized_at timestamptz;
;
