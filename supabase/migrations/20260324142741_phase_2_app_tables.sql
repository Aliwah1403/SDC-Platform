
-- ============================================================
-- handle_updated_at() — reusable trigger for updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. profiles (1:1 extension of auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  nickname text CHECK (char_length(nickname) <= 20),
  avatar_url text,
  fcm_token text,
  dob date,
  scd_type text CHECK (scd_type IN ('HbSS','HbSC','HbSB0','HbSB+','HbSD','HbSE','unsure')),
  check_in_time text,
  notifications_enabled boolean DEFAULT false,
  biometrics_enabled boolean DEFAULT false,
  height numeric,
  weight numeric,
  preferred_hospital text,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. health_logs (append-only raw symptom entries)
-- ============================================================
CREATE TABLE public.health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  pain_level integer CHECK (pain_level BETWEEN 0 AND 10),
  body_locations text[] DEFAULT '{}',
  symptoms text[] DEFAULT '{}',
  mood integer CHECK (mood BETWEEN 1 AND 5),
  hydration integer CHECK (hydration BETWEEN 0 AND 10),
  notes text,
  triggers text[] DEFAULT '{}',
  activities text[] DEFAULT '{}',
  is_repaired boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. daily_summaries (aggregated daily data)
-- ============================================================
CREATE TABLE public.daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  pain_level integer CHECK (pain_level BETWEEN 0 AND 10),
  hydration integer CHECK (hydration BETWEEN 0 AND 10),
  mood integer CHECK (mood BETWEEN 1 AND 5),
  steps integer,
  sleep_hours numeric,
  heart_rate integer,
  is_repaired boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- 4. medications
-- ============================================================
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text CHECK (frequency IN ('Daily','Twice daily','Three times daily','Weekly','As needed')),
  type text DEFAULT 'tablet' CHECK (type IN ('tablet','capsule','softgel','liquid','injection','other')),
  prescribed_by text,
  start_date date,
  is_active boolean DEFAULT true,
  time text,
  notes text,
  category text CHECK (category IN ('Disease-modifying','Iron chelation','Supportive','Pain management','Other')),
  rxcui text,
  brand_names text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. medication_logs (daily taken tracking)
-- ============================================================
CREATE TABLE public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  taken_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (medication_id, date)
);

-- ============================================================
-- 6. appointments
-- ============================================================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  doctor text,
  specialty text,
  facility text,
  date date NOT NULL,
  time text,
  type text CHECK (type IN ('routine','blood-work','follow-up','specialist','other')),
  notes text,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','cancelled')),
  added_to_calendar boolean DEFAULT false,
  calendar_event_id text,
  reminder_ids text[] DEFAULT '{}',
  reminder_offsets integer[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. emergency_contacts
-- ============================================================
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text NOT NULL,
  is_primary boolean DEFAULT false,
  photo_url text,
  call_count integer DEFAULT 0,
  last_called_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. streaks (one row per user)
-- ============================================================
CREATE TABLE public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_log_date date,
  repairs_available integer DEFAULT 2,
  repairs_used integer DEFAULT 0,
  repairs_earned integer DEFAULT 3,
  days_until_next_repair integer DEFAULT 30,
  repair_progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 9. user_badges
-- ============================================================
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- ============================================================
-- 10. metric_goals (one row per user)
-- ============================================================
CREATE TABLE public.metric_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hydration integer DEFAULT 8,
  sleep integer DEFAULT 8,
  steps integer DEFAULT 10000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 11. chat_messages
-- ============================================================
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- This table exists in production but was originally created outside recorded
-- migration history. Reconstruct it beside its parent emergency_contacts table
-- so local and future staging databases have the complete application schema.
CREATE TABLE public.contact_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
  called_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contact_call_logs_contact_idx
  ON public.contact_call_logs (user_id, contact_id, called_at DESC);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_health_logs_user_date ON public.health_logs (user_id, date);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries (user_id, date DESC);
CREATE INDEX idx_medications_user_active ON public.medications (user_id) WHERE is_active = true;
CREATE INDEX idx_medication_logs_user_date ON public.medication_logs (user_id, date);
CREATE INDEX idx_appointments_user_date ON public.appointments (user_id, date);
CREATE INDEX idx_emergency_contacts_user ON public.emergency_contacts (user_id);
CREATE INDEX idx_user_badges_user ON public.user_badges (user_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages (user_id, created_at);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER medications_updated_at BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER emergency_contacts_updated_at BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER metric_goals_updated_at BEFORE UPDATE ON public.metric_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS — enable + 4 policies per table
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- health_logs
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_logs_select" ON public.health_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "health_logs_insert" ON public.health_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_logs_update" ON public.health_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "health_logs_delete" ON public.health_logs FOR DELETE USING (auth.uid() = user_id);

-- daily_summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_summaries_select" ON public.daily_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_summaries_insert" ON public.daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_summaries_update" ON public.daily_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_summaries_delete" ON public.daily_summaries FOR DELETE USING (auth.uid() = user_id);

-- medications
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications_select" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "medications_insert" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medications_update" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "medications_delete" ON public.medications FOR DELETE USING (auth.uid() = user_id);

-- medication_logs
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medication_logs_select" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "medication_logs_insert" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medication_logs_update" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "medication_logs_delete" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);

-- appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- emergency_contacts
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergency_contacts_select" ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_insert" ON public.emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_update" ON public.emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_delete" ON public.emergency_contacts FOR DELETE USING (auth.uid() = user_id);

-- streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_select" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_insert" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "streaks_delete" ON public.streaks FOR DELETE USING (auth.uid() = user_id);

-- user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_badges_update" ON public.user_badges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_badges_delete" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

-- metric_goals
ALTER TABLE public.metric_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metric_goals_select" ON public.metric_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "metric_goals_insert" ON public.metric_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "metric_goals_update" ON public.metric_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "metric_goals_delete" ON public.metric_goals FOR DELETE USING (auth.uid() = user_id);

-- chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.contact_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own call logs"
  ON public.contact_call_logs FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own call logs"
  ON public.contact_call_logs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own call logs"
  ON public.contact_call_logs FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- handle_new_user() — auto-create rows on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);

  INSERT INTO public.metric_goals (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
;
