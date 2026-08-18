
-- Allow authenticated users to update (revoke) their own tokens
CREATE POLICY "Users can update own export tokens"
  ON export_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix public SELECT to also require is_active = TRUE
DROP POLICY "Public can view unexpired tokens by token value" ON export_tokens;

CREATE POLICY "Public can view active unexpired tokens"
  ON export_tokens
  FOR SELECT
  TO anon
  USING (is_active = TRUE AND expires_at > now());
;
