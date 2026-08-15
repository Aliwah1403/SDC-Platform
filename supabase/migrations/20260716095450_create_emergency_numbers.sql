create table if not exists emergency_numbers (
  iso_country text        primary key,
  ambulance   text        not null,
  notes       text,
  updated_at  timestamptz not null default now()
);

alter table emergency_numbers enable row level security;

create policy "Public read access to emergency numbers"
  on emergency_numbers
  for select
  to anon, authenticated
  using (true);;

-- The following hydration changes exist in production but their original
-- local migration versions were not recorded in production's migration
-- history. Reconstruct them here, before the later recorded hydration
-- backfills, so this authoritative version sequence can replay from empty.

ALTER TABLE health_logs
  DROP CONSTRAINT IF EXISTS health_logs_hydration_check;
ALTER TABLE health_logs
  ADD CONSTRAINT health_logs_hydration_check
  CHECK (hydration >= 0 AND hydration <= 10000);

ALTER TABLE daily_summaries
  DROP CONSTRAINT IF EXISTS daily_summaries_hydration_check;
ALTER TABLE daily_summaries
  ADD CONSTRAINT daily_summaries_hydration_check
  CHECK (hydration >= 0 AND hydration <= 10000);

ALTER TABLE metric_goals
  DROP CONSTRAINT IF EXISTS metric_goals_hydration_check;
ALTER TABLE metric_goals
  ADD CONSTRAINT metric_goals_hydration_check
  CHECK (hydration >= 0 AND hydration <= 10000);

UPDATE health_logs
SET hydration = hydration * 250
WHERE hydration > 0 AND hydration <= 10;

UPDATE daily_summaries
SET hydration = hydration * 250
WHERE hydration > 0 AND hydration <= 10;

UPDATE metric_goals
SET hydration = hydration * 250
WHERE hydration > 0 AND hydration <= 10;

CREATE TABLE IF NOT EXISTS hydration_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ml INTEGER NOT NULL CHECK (ml >= 100 AND ml <= 2000),
  emoji TEXT,
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hydration_containers_user_id_idx
  ON hydration_containers (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS hydration_containers_one_default_per_user
  ON hydration_containers (user_id)
  WHERE is_default;

ALTER TABLE hydration_containers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hydration containers"
  ON hydration_containers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration containers"
  ON hydration_containers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration containers"
  ON hydration_containers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hydration containers"
  ON hydration_containers FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_default_hydration_container(p_container_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE hydration_containers
  SET is_default = (id = p_container_id), updated_at = now()
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION remove_hydration_container(p_container_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_was_default BOOLEAN;
  v_remaining_count INTEGER;
  v_promote_id UUID;
BEGIN
  SELECT count(*) INTO v_remaining_count
  FROM hydration_containers
  WHERE user_id = auth.uid();

  IF v_remaining_count <= 1 THEN
    RETURN false;
  END IF;

  SELECT is_default INTO v_was_default
  FROM hydration_containers
  WHERE id = p_container_id AND user_id = auth.uid();

  DELETE FROM hydration_containers
  WHERE id = p_container_id AND user_id = auth.uid();

  IF v_was_default THEN
    SELECT id INTO v_promote_id
    FROM hydration_containers
    WHERE user_id = auth.uid()
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;

    IF v_promote_id IS NOT NULL THEN
      UPDATE hydration_containers
      SET is_default = true, updated_at = now()
      WHERE id = v_promote_id;
    END IF;
  END IF;

  RETURN true;
END;
$$;

INSERT INTO hydration_containers
  (user_id, name, ml, emoji, icon, is_default, sort_order)
SELECT
  p.user_id,
  v.name,
  v.ml,
  v.emoji,
  v.icon,
  v.is_default,
  v.sort_order
FROM profiles p
CROSS JOIN (VALUES
  ('Glass', 250, '🥛', 'glass-water', true, 0),
  ('Bottle', 500, '🍶', 'bottle', false, 1),
  ('Large', 1000, '🫙', 'carton', false, 2)
) AS v(name, ml, emoji, icon, is_default, sort_order)
WHERE p.onboarding_complete = true
  AND NOT EXISTS (
    SELECT 1
    FROM hydration_containers hc
    WHERE hc.user_id = p.user_id
  );
