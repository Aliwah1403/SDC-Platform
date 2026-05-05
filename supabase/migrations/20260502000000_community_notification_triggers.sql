-- Add aggregation columns to community_notifications.
-- actor_name: the first actor's display name (shown in notification text)
-- actor_count: total number of actors (for "X and N others" text)
-- comment_id: for reply aggregation — groups replies to the same parent comment
-- updated_at: when the row was last touched (for sorting and cleanup)
ALTER TABLE community_notifications
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS actor_count INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── Like trigger ────────────────────────────────────────────────────────────
-- Fires on every INSERT into community_likes.
-- Aggregates: one unread row per (post_id, 'like', recipient). Subsequent likes
-- increment actor_count on the existing row instead of inserting a new one.
-- This keeps the table small and avoids push-spam — the push is only sent once
-- (the first time, via the Supabase Database Webhook on community_notifications INSERT).

CREATE OR REPLACE FUNCTION handle_community_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author   UUID;
  v_actor_name    TEXT;
  v_existing_id   UUID;
BEGIN
  -- Look up who owns the post
  SELECT user_id INTO v_post_author
    FROM community_posts WHERE id = NEW.post_id;

  -- Skip if post not found or user liked their own post
  IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the liker's display name
  SELECT nickname INTO v_actor_name
    FROM profiles WHERE user_id = NEW.user_id;

  -- Check for an existing unread like notification for this post+recipient
  SELECT id INTO v_existing_id
    FROM community_notifications
    WHERE user_id = v_post_author
      AND type = 'like'
      AND post_id = NEW.post_id
      AND read = false
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Aggregate: increment count, keep most recent actor name
    UPDATE community_notifications
    SET actor_count = actor_count + 1,
        actor_name  = v_actor_name,
        updated_at  = now()
    WHERE id = v_existing_id;
  ELSE
    -- First like: insert a fresh row (triggers the Database Webhook → push)
    INSERT INTO community_notifications (user_id, type, post_id, actor_name, actor_count, updated_at)
    VALUES (v_post_author, 'like', NEW.post_id, v_actor_name, 1, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_like_insert ON community_likes;
CREATE TRIGGER on_community_like_insert
  AFTER INSERT ON community_likes
  FOR EACH ROW EXECUTE FUNCTION handle_community_like();

-- ── Comment / Reply trigger ─────────────────────────────────────────────────
-- Fires on every INSERT into community_comments.
-- Comments (parent_comment_id IS NULL): always one notification per comment
--   → notifies the post author.
-- Replies (parent_comment_id IS NOT NULL): aggregated per parent comment
--   → notifies the parent comment author; deduplicates via comment_id.

CREATE OR REPLACE FUNCTION handle_community_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author     UUID;
  v_parent_author   UUID;
  v_actor_name      TEXT;
  v_post_snippet    TEXT;
  v_existing_id     UUID;
BEGIN
  -- Get actor display name
  SELECT nickname INTO v_actor_name
    FROM profiles WHERE user_id = NEW.user_id;

  IF NEW.parent_comment_id IS NULL THEN
    -- ── Top-level comment ──────────────────────────────────────────────────
    SELECT user_id INTO v_post_author
      FROM community_posts WHERE id = NEW.post_id;

    IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN
      RETURN NEW;
    END IF;

    -- Include a short snippet of the comment content
    v_post_snippet := left(NEW.content, 80);

    INSERT INTO community_notifications
      (user_id, type, post_id, actor_name, actor_count, updated_at)
    VALUES
      (v_post_author, 'comment', NEW.post_id, v_actor_name, 1, now());

  ELSE
    -- ── Reply ──────────────────────────────────────────────────────────────
    SELECT user_id INTO v_parent_author
      FROM community_comments WHERE id = NEW.parent_comment_id;

    IF v_parent_author IS NULL OR v_parent_author = NEW.user_id THEN
      RETURN NEW;
    END IF;

    -- Check for an existing unread reply notification for this parent comment
    SELECT id INTO v_existing_id
      FROM community_notifications
      WHERE user_id = v_parent_author
        AND type = 'reply'
        AND comment_id = NEW.parent_comment_id
        AND read = false
      LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      UPDATE community_notifications
      SET actor_count = actor_count + 1,
          actor_name  = v_actor_name,
          updated_at  = now()
      WHERE id = v_existing_id;
    ELSE
      INSERT INTO community_notifications
        (user_id, type, post_id, comment_id, actor_name, actor_count, updated_at)
      VALUES
        (v_parent_author, 'reply', NEW.post_id, NEW.parent_comment_id, v_actor_name, 1, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_comment_insert ON community_comments;
CREATE TRIGGER on_community_comment_insert
  AFTER INSERT ON community_comments
  FOR EACH ROW EXECUTE FUNCTION handle_community_comment();

-- ── Push trigger ────────────────────────────────────────────────────────────
-- Fires on INSERT into community_notifications (i.e. only for first-event rows,
-- never for UPDATEs that aggregate subsequent likes/replies).
-- Calls the send-community-push Edge Function via pg_net (async, non-blocking).
-- URL and anon key are read from database settings set separately via ALTER DATABASE.

CREATE OR REPLACE FUNCTION handle_community_notification_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://uphhntnjzfsckeuxjhco.supabase.co/functions/v1/send-community-push',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaGhudG5qemZzY2tldXhqaGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTAyOTksImV4cCI6MjA4NTE4NjI5OX0.Jr2oeA5u238ntzQKYidXHBPJOd13F1a985QZtgUuX0g"}'::jsonb,
    body    := row_to_json(NEW)::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_notification_push ON community_notifications;
CREATE TRIGGER on_community_notification_push
  AFTER INSERT ON community_notifications
  FOR EACH ROW EXECUTE FUNCTION handle_community_notification_push();

-- ── Cleanup: delete read notifications older than 60 days ───────────────────
-- Run manually or schedule via pg_cron if available.
-- DELETE FROM community_notifications WHERE read = true AND updated_at < now() - interval '60 days';
