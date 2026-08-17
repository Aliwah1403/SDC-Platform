
CREATE TABLE export_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL CHECK (mode IN ('full_export', 'health_summary')),
  date_range_start date,
  date_range_end date,
  period_days int,
  data_snapshot jsonb NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  password_hash text,
  view_count int NOT NULL DEFAULT 0,
  max_views int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX export_tokens_token_idx ON export_tokens(token);
CREATE INDEX export_tokens_user_id_idx ON export_tokens(user_id);

ALTER TABLE export_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export tokens"
  ON export_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own export tokens"
  ON export_tokens FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view unexpired tokens by token value"
  ON export_tokens FOR SELECT
  USING (expires_at > now());
;
