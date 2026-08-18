-- Follow-up to 20260716000000_hydration_ml_migration.sql.
--
-- That migration widened the hydration constraints and backfilled existing rows
-- from the glasses scale to canonical ml (x250), but it never changed the
-- metric_goals.hydration COLUMN DEFAULT, which was left at the glasses-era `8`.
--
-- handle_new_user() creates the goals row with `INSERT INTO metric_goals
-- (user_id) VALUES (NEW.id)` — every column falls back to its default. So every
-- user signing up after the ml migration receives a hydration goal of 8 ml
-- instead of 2000 ml, which reads as ~0 L in the app and makes every hydration
-- goal trivially met (both in-app and in the generated reports, which now use
-- the user's real goal rather than a hardcoded one).

ALTER TABLE metric_goals
  ALTER COLUMN hydration SET DEFAULT 2000;

-- Repair any row created from the stale default since the ml migration. Guarded
-- by `<= 10` exactly as the original backfill was, so this stays idempotent and
-- can never double-convert a row that is already ml-scale (the smallest real ml
-- goal the app writes is far above 10).
UPDATE metric_goals
  SET hydration = 2000
  WHERE hydration > 0 AND hydration <= 10;;
