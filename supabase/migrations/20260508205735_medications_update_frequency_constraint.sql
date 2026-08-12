
ALTER TABLE medications
  DROP CONSTRAINT IF EXISTS medications_frequency_check;

ALTER TABLE medications
  ADD CONSTRAINT medications_frequency_check CHECK (
    frequency IN (
      'Every Day',
      'Specific Days',
      'As Needed',
      'Daily',
      'Twice daily',
      'Three times daily',
      'Weekly',
      'As needed'
    )
  );

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS times         jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_days jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weekday       smallint DEFAULT NULL;
;
