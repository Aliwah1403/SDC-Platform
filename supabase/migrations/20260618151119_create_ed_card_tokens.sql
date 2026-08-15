
CREATE TABLE public.ed_card_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text        UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_data  jsonb       NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_card_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can read a token row (token string itself is the credential)
CREATE POLICY "public_select" ON public.ed_card_tokens
  FOR SELECT USING (true);

-- Authenticated owner can insert
CREATE POLICY "owner_insert" ON public.ed_card_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated owner can revoke (set is_active = false)
CREATE POLICY "owner_update" ON public.ed_card_tokens
  FOR UPDATE USING (auth.uid() = user_id);
;
