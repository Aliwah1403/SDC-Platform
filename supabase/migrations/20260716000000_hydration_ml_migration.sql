-- Hydration went from glasses-scale integer storage to canonical millilitres
-- (see src/utils/hydrationGoal.js — GLASS_ML = 250). The client code was updated
-- to read/write ml everywhere, but these two DB-side pieces were never applied:
--
-- 1. health_logs_hydration_check and daily_summaries_hydration_check (confirmed
--    via `pg_constraint`: both were `CHECK (hydration >= 0 AND hydration <= 10)`)
--    still bound hydration to the old glasses-scale range, so any real ml write
--    (e.g. 250, 2500) violates the constraint — this is the
--    "violates check constraint health_logs_hydration_check" error.
--    metric_goals has no existing check constraint on hydration (confirmed via
--    the same query) — the one added below is new data-integrity hardening,
--    not a fix to a pre-existing constraint.
-- 2. Existing rows written before the ml migration are still glasses-scale (0-10)
--    and need to be multiplied by 250 to mean the same thing under the new unit.

-- 1. Widen constraints first so the backfill below doesn't violate them.
ALTER TABLE health_logs
  DROP CONSTRAINT IF EXISTS health_logs_hydration_check;
ALTER TABLE health_logs
  ADD CONSTRAINT health_logs_hydration_check CHECK (hydration >= 0 AND hydration <= 10000);

ALTER TABLE daily_summaries
  DROP CONSTRAINT IF EXISTS daily_summaries_hydration_check;
ALTER TABLE daily_summaries
  ADD CONSTRAINT daily_summaries_hydration_check CHECK (hydration >= 0 AND hydration <= 10000);

ALTER TABLE metric_goals
  DROP CONSTRAINT IF EXISTS metric_goals_hydration_check;
ALTER TABLE metric_goals
  ADD CONSTRAINT metric_goals_hydration_check CHECK (hydration >= 0 AND hydration <= 10000);

-- 2. Backfill existing glasses-scale values to ml (x250). Guarded by `<= 10` to
-- match the confirmed old constraint bound exactly, so this can never
-- double-convert a row that's already ml-scale (the smallest non-zero ml
-- amount the app ever wrote is 250, well above 10).
UPDATE health_logs
  SET hydration = hydration * 250
  WHERE hydration > 0 AND hydration <= 10;

UPDATE daily_summaries
  SET hydration = hydration * 250
  WHERE hydration > 0 AND hydration <= 10;

UPDATE metric_goals
  SET hydration = hydration * 250
  WHERE hydration > 0 AND hydration <= 10;
