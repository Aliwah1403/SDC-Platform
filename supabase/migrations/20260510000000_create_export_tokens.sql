CREATE TABLE export_tokens (
  token              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode               TEXT NOT NULL CHECK (mode IN ('full_export', 'health_summary')),
  date_range_start   DATE,
  date_range_end     DATE,
  period_days        INTEGER,
  data_snapshot      JSONB NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  view_count         INTEGER NOT NULL DEFAULT 0,
  max_views          INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE export_tokens ENABLE ROW LEVEL SECURITY;

-- Public (anon) can read active tokens only — revoked tokens become invisible
CREATE POLICY "anon_read_active_tokens"
  ON export_tokens FOR SELECT
  TO anon
  USING (is_active = TRUE);

-- Authenticated users can read all their own tokens (including revoked)
CREATE POLICY "auth_read_own_tokens"
  ON export_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can update their own tokens (for revocation)
CREATE POLICY "auth_update_own_tokens"
  ON export_tokens FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_export_tokens_user_mode_active
  ON export_tokens (user_id, mode, is_active);
