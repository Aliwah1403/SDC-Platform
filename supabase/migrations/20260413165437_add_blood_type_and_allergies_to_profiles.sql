
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}';
;
