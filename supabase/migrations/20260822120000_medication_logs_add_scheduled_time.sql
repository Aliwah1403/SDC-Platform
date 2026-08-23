-- Keep a medication log attached to the specific scheduled dose it records.
-- Without this, a second daily dose can only be inferred from insertion order.
ALTER TABLE public.medication_logs
  ADD COLUMN IF NOT EXISTS scheduled_time text;

CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_date_scheduled_time
  ON public.medication_logs (medication_id, date, scheduled_time);
