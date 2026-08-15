-- Normalize streak repair accounting:
-- - New users start with 3 available repairs.
-- - "Total earned" tracks repairs earned through the consecutive-day rule, so it starts at 0.
-- - Repairs are earned every 30 consecutive logged days.

ALTER TABLE public.streaks
  ALTER COLUMN repairs_available SET DEFAULT 3,
  ALTER COLUMN repairs_earned SET DEFAULT 0,
  ALTER COLUMN days_until_next_repair SET DEFAULT 30;

-- Convert existing rows from the old accounting model:
-- - old `repairs_earned` included the starter repairs, so subtract 3.
-- - old `repairs_available` started at 2 even though the product model is 3,
--   so add 1 to preserve the user's effective balance.
-- Example: 2 available / 0 used / 3 earned becomes 3 available / 0 used / 0 earned.
UPDATE public.streaks
SET
  repairs_available = COALESCE(repairs_available, 0) + 1,
  repairs_earned = GREATEST(COALESCE(repairs_earned, 0) - 3, 0),
  days_until_next_repair = 30,
  updated_at = now()
WHERE
  COALESCE(repairs_earned, 0) >= 3;

-- Enforce the current product earning target for rows that may have been
-- created or edited with earlier beta values.
UPDATE public.streaks
SET
  days_until_next_repair = 30,
  updated_at = now()
WHERE
  days_until_next_repair IS DISTINCT FROM 30;
