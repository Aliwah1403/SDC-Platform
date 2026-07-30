-- Widen the mood CHECK constraints on health_logs and daily_summaries to allow
-- 0, which is the app-wide "not logged" sentinel (mirrors pain_level's
-- existing >= 0 range, where 0 means "no pain"). Previously mood only allowed
-- 1-5, which forced addHydrationQuickly() to fabricate a fake mood of 1
-- ("Low") whenever a quick-add hydration action was the first log of the day.
-- Purely permissive change; existing data is all within 1-5, so no backfill
-- is needed.

ALTER TABLE health_logs
  DROP CONSTRAINT IF EXISTS health_logs_mood_check;

ALTER TABLE health_logs
  ADD CONSTRAINT health_logs_mood_check CHECK (mood >= 0 AND mood <= 5);

ALTER TABLE daily_summaries
  DROP CONSTRAINT IF EXISTS daily_summaries_mood_check;

ALTER TABLE daily_summaries
  ADD CONSTRAINT daily_summaries_mood_check CHECK (mood >= 0 AND mood <= 5);
