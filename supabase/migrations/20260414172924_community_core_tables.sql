
-- ── community_posts ────────────────────────────────────────────────────────
CREATE TABLE community_posts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content              TEXT        NOT NULL CHECK (char_length(content) <= 500),
  image_url            TEXT,
  category             VARCHAR(20) NOT NULL,
  flair                VARCHAR(20),
  is_anonymous         BOOLEAN     NOT NULL DEFAULT FALSE,
  is_system_post       BOOLEAN     NOT NULL DEFAULT FALSE,
  system_category      VARCHAR(20),
  is_discussion_prompt BOOLEAN     NOT NULL DEFAULT FALSE,
  like_count           INTEGER     NOT NULL DEFAULT 0,
  comment_count        INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select" ON community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert" ON community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── community_comments (top-level comments + replies via parent_comment_id) ─
CREATE TABLE community_comments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID        REFERENCES community_comments(id) ON DELETE CASCADE,
  replying_to_name  TEXT,
  content           TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON community_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON community_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── community_likes ────────────────────────────────────────────────────────
CREATE TABLE community_likes (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select" ON community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert" ON community_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON community_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── community_saves ────────────────────────────────────────────────────────
CREATE TABLE community_saves (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE community_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_select" ON community_saves FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "saves_insert" ON community_saves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saves_delete" ON community_saves FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── community_category_preferences ────────────────────────────────────────
CREATE TABLE community_category_preferences (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id VARCHAR(20) NOT NULL,
  action      VARCHAR(10) NOT NULL CHECK (action IN ('follow', 'block')),
  PRIMARY KEY (user_id, category_id)
);
ALTER TABLE community_category_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catpref_all" ON community_category_preferences
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
;
