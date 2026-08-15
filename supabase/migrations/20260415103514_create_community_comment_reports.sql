
CREATE TABLE community_comment_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id   UUID        NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  reporter_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason       TEXT        NOT NULL,
  description  TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, comment_id)
);
ALTER TABLE community_comment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_reports_insert" ON community_comment_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "comment_reports_select" ON community_comment_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
;
