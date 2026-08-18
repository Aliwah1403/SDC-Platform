ALTER TABLE health_logs
  DROP CONSTRAINT IF EXISTS health_logs_mood_check;

ALTER TABLE health_logs
  ADD CONSTRAINT health_logs_mood_check CHECK (mood >= 0 AND mood <= 5);

ALTER TABLE daily_summaries
  DROP CONSTRAINT IF EXISTS daily_summaries_mood_check;

ALTER TABLE daily_summaries
  ADD CONSTRAINT daily_summaries_mood_check CHECK (mood >= 0 AND mood <= 5);
;
