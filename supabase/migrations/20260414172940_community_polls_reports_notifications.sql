
-- ── community_poll_options ─────────────────────────────────────────────────
CREATE TABLE community_poll_options (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID     NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  option_text TEXT     NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  vote_count  INTEGER  NOT NULL DEFAULT 0
);
ALTER TABLE community_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pollopts_select" ON community_poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "pollopts_insert" ON community_poll_options FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM community_posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

-- ── community_poll_votes ───────────────────────────────────────────────────
CREATE TABLE community_poll_votes (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  option_id  UUID        NOT NULL REFERENCES community_poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pollvotes_select" ON community_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "pollvotes_insert" ON community_poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pollvotes_delete" ON community_poll_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── community_reports ──────────────────────────────────────────────────────
CREATE TABLE community_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      TEXT        NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, post_id)
);
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON community_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select" ON community_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- ── community_notifications ────────────────────────────────────────────────
CREATE TABLE community_notifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          VARCHAR(30) NOT NULL,
  actor_name    TEXT,
  post_id       UUID        REFERENCES community_posts(id) ON DELETE SET NULL,
  post_snippet  TEXT,
  category_id   VARCHAR(20),
  category_name TEXT,
  action        TEXT,
  reason        TEXT,
  read          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifs_own" ON community_notifications
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
;
