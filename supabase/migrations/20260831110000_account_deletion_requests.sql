-- Email-confirmed deletion requests for people who no longer have the app.
-- Tokens are stored only as SHA-256 hashes and disappear with the user record.
CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX account_deletion_requests_expires_at_idx
  ON public.account_deletion_requests (expires_at);
