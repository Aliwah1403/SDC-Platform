-- Replace the old frequency check constraint with one that accepts both
-- legacy values (Daily, Twice daily, Three times daily, Weekly, As needed)
-- and new schedule values (Every Day, Specific Days, As Needed).

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

-- Also add columns for the new schedule fields if they don't exist yet.
ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS times       jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_days jsonb  DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weekday     smallint DEFAULT NULL;

-- Normalize any out-of-range weekday values before adding the constraint.
UPDATE medications
  SET weekday = NULL
  WHERE weekday IS NOT NULL AND weekday NOT BETWEEN 1 AND 7;

ALTER TABLE medications
  DROP CONSTRAINT IF EXISTS medications_weekday_range_chk;

ALTER TABLE medications
  ADD CONSTRAINT medications_weekday_range_chk CHECK (weekday BETWEEN 1 AND 7);
