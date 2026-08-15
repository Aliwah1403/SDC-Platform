
-- ── like_count trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_like_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- ── comment_count trigger (top-level only) ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NULL THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NULL THEN
    UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ── poll vote_count trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_poll_option_vote_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.option_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_poll_vote_count
  AFTER INSERT OR DELETE ON community_poll_votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_option_vote_count();

-- ── report threshold: notify author at 3 reports ───────────────────────────
CREATE OR REPLACE FUNCTION handle_report_threshold() RETURNS TRIGGER AS $$
DECLARE
  report_count INT;
  post_rec     RECORD;
BEGIN
  SELECT COUNT(*) INTO report_count
    FROM community_reports WHERE post_id = NEW.post_id;

  IF report_count >= 3 THEN
    SELECT user_id, content INTO post_rec
      FROM community_posts WHERE id = NEW.post_id;

    INSERT INTO community_notifications
      (user_id, type, post_id, post_snippet, action, reason)
    VALUES
      (post_rec.user_id, 'post_actioned', NEW.post_id,
       LEFT(post_rec.content, 60), 'removed', NEW.reason)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_report_threshold
  AFTER INSERT ON community_reports
  FOR EACH ROW EXECUTE FUNCTION handle_report_threshold();
;
