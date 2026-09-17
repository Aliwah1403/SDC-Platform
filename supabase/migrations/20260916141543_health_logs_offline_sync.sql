-- Offline symptom logs need a client-owned idempotency key and the local
-- capture metadata preserved through replay. Existing rows remain valid.
ALTER TABLE public.health_logs
  ADD COLUMN IF NOT EXISTS client_mutation_id uuid,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS captured_timezone text;

CREATE UNIQUE INDEX IF NOT EXISTS health_logs_user_client_mutation_id_uidx
  ON public.health_logs (user_id, client_mutation_id)
  WHERE client_mutation_id IS NOT NULL;

-- One authenticated, transactional write replaces the former client-side
-- insert/aggregate/summary/streak sequence. SECURITY INVOKER preserves the
-- existing RLS policies; auth.uid() is checked explicitly as defense in depth.
CREATE OR REPLACE FUNCTION public.submit_health_log(
  p_client_mutation_id uuid,
  p_captured_at timestamptz,
  p_captured_local_date date,
  p_captured_timezone text,
  p_pain_level integer,
  p_body_locations text[] DEFAULT '{}',
  p_symptoms text[] DEFAULT '{}',
  p_mood integer DEFAULT 1,
  p_hydration integer DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_triggers text[] DEFAULT '{}',
  p_activities text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
  v_log public.health_logs%ROWTYPE;
  v_summary public.daily_summaries%ROWTYPE;
  v_streak public.streaks%ROWTYPE;
  v_existing boolean := false;
  v_max_pain integer;
  v_max_hydration integer;
  v_latest_mood integer;
  v_last_date date;
  v_consecutive boolean;
  v_new_streak integer;
  v_new_longest integer;
  v_days_target integer;
  v_new_progress integer;
  v_earned_repair boolean := false;
  v_latest_date date;
  v_recomputed_streak integer := 0;
  v_recomputed_longest integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_client_mutation_id IS NULL OR p_captured_local_date IS NULL THEN
    RAISE EXCEPTION 'Mutation id and local date are required' USING ERRCODE = '22004';
  END IF;

  -- Serialize logs for one user/date and lock the streak row so replay of an
  -- older offline date cannot regress a newer streak.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_captured_local_date::text, 0));

  SELECT * INTO v_log
  FROM public.health_logs
  WHERE user_id = v_user_id AND client_mutation_id = p_client_mutation_id
  FOR UPDATE;
  v_existing := FOUND;

  IF NOT v_existing THEN
    INSERT INTO public.health_logs (
      user_id, date, client_mutation_id, captured_at, captured_timezone,
      pain_level, body_locations, symptoms, mood, hydration, notes, triggers, activities
    ) VALUES (
      v_user_id, p_captured_local_date, p_client_mutation_id,
      COALESCE(p_captured_at, now()), p_captured_timezone,
      p_pain_level, COALESCE(p_body_locations, '{}'), COALESCE(p_symptoms, '{}'),
      p_mood, p_hydration, p_notes, COALESCE(p_triggers, '{}'), COALESCE(p_activities, '{}')
    )
    RETURNING * INTO v_log;
  END IF;

  SELECT COALESCE(MAX(pain_level), 0), COALESCE(MAX(hydration), 0)
  INTO v_max_pain, v_max_hydration
  FROM public.health_logs
  WHERE user_id = v_user_id AND date = p_captured_local_date;

  SELECT mood INTO v_latest_mood
  FROM public.health_logs
  WHERE user_id = v_user_id AND date = p_captured_local_date
  ORDER BY COALESCE(captured_at, created_at) DESC, created_at DESC, id DESC
  LIMIT 1;

  INSERT INTO public.daily_summaries (user_id, date, pain_level, hydration, mood, updated_at)
  VALUES (v_user_id, p_captured_local_date, v_max_pain, v_max_hydration, COALESCE(v_latest_mood, p_mood), now())
  ON CONFLICT (user_id, date) DO UPDATE SET
    pain_level = EXCLUDED.pain_level,
    hydration = EXCLUDED.hydration,
    mood = EXCLUDED.mood,
    updated_at = now()
  RETURNING * INTO v_summary;

  INSERT INTO public.streaks (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak
  FROM public.streaks
  WHERE user_id = v_user_id
  FOR UPDATE;
  v_last_date := v_streak.last_log_date;

  -- Recompute date-derived streaks from all distinct dates. This means a
  -- late offline date that fills a gap cannot leave current/longest streaks
  -- dependent on network arrival order. Repair progress/counters retain the
  -- existing arrival-based policy below.
  WITH RECURSIVE dates AS (
    SELECT DISTINCT date
    FROM public.health_logs
    WHERE user_id = v_user_id
  ), current_chain(date, chain_length) AS (
    SELECT max(date), 1
    FROM dates
    UNION ALL
    SELECT d.date, c.chain_length + 1
    FROM current_chain c
    JOIN dates d ON d.date = c.date - 1
  ), grouped_dates AS (
    SELECT date, date - (row_number() OVER (ORDER BY date))::integer AS grp
    FROM dates
  ), run_lengths AS (
    SELECT grp, count(*)::integer AS run_length
    FROM grouped_dates
    GROUP BY grp
  )
  SELECT COALESCE((SELECT max(chain_length) FROM current_chain), 0),
         COALESCE((SELECT max(run_length) FROM run_lengths), 0)
  INTO v_recomputed_streak, v_recomputed_longest;
  SELECT max(date) INTO v_latest_date
  FROM public.health_logs
  WHERE user_id = v_user_id;

  -- A replayed date that is older than the current streak updates its daily
  -- summary but does not move last_log_date backwards or alter repairs.
  IF NOT v_existing AND (v_last_date IS NULL OR p_captured_local_date > v_last_date) THEN
    v_consecutive := v_last_date = (p_captured_local_date - 1);
    v_new_streak := v_recomputed_streak;
    v_new_longest := GREATEST(COALESCE(v_streak.longest_streak, 0), v_recomputed_longest);
    v_days_target := COALESCE(v_streak.days_until_next_repair, 30);
    v_new_progress := CASE WHEN v_consecutive THEN COALESCE(v_streak.repair_progress, 0) ELSE 0 END + 1;
    v_earned_repair := v_new_progress >= v_days_target;

    UPDATE public.streaks
    SET current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_log_date = v_latest_date,
        repair_progress = CASE WHEN v_earned_repair THEN 0 ELSE v_new_progress END,
        repairs_available = CASE WHEN v_earned_repair THEN COALESCE(v_streak.repairs_available, 0) + 1 ELSE v_streak.repairs_available END,
        repairs_earned = CASE WHEN v_earned_repair THEN COALESCE(v_streak.repairs_earned, 0) + 1 ELSE v_streak.repairs_earned END,
        updated_at = now()
    WHERE user_id = v_user_id;
  ELSIF NOT v_existing THEN
    -- The newly inserted date is older than the previous head. It still
    -- changes the deterministic date-derived streak (for example D+1 was
    -- synced before an offline D), but must not replay arrival-based repair
    -- accounting or move the head backwards.
    UPDATE public.streaks
    SET current_streak = v_recomputed_streak,
        longest_streak = GREATEST(COALESCE(v_streak.longest_streak, 0), v_recomputed_longest),
        last_log_date = GREATEST(v_last_date, v_latest_date),
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  SELECT * INTO v_streak FROM public.streaks WHERE user_id = v_user_id;
  RETURN jsonb_build_object(
    'duplicate', v_existing,
    'log', to_jsonb(v_log),
    'summary', to_jsonb(v_summary),
    'streak', to_jsonb(v_streak)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_health_log(uuid, timestamptz, date, text, integer, text[], text[], integer, integer, text, text[], text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_health_log(uuid, timestamptz, date, text, integer, text[], text[], integer, integer, text, text[], text[]) TO authenticated;
