ALTER TABLE streaks ADD COLUMN claimed_badges jsonb DEFAULT '[]'::jsonb NOT NULL;;
