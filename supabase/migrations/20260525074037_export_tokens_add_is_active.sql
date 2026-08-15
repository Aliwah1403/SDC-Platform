ALTER TABLE export_tokens ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_export_tokens_user_mode_active ON export_tokens (user_id, mode, is_active);;
