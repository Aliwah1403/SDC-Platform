-- Add aggregation columns to community_notifications.
ALTER TABLE community_notifications
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS actor_count INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── Like trigger ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_community_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author   UUID;
  v_actor_name    TEXT;
  v_existing_id   UUID;
BEGIN
  SELECT user_id INTO v_post_author
    FROM community_posts WHERE id = NEW.post_id;

  IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT nickname INTO v_actor_name
    FROM profiles WHERE user_id = NEW.user_id;

  SELECT id INTO v_existing_id
    FROM community_notifications
    WHERE user_id = v_post_author
      AND type = 'like'
      AND post_id = NEW.post_id
      AND read = false
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE community_notifications
    SET actor_count = actor_count + 1,
        actor_name  = v_actor_name,
        updated_at  = now()
    WHERE id = v_existing_id;
  ELSE
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
CREATE OR REPLACE FUNCTION handle_community_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author     UUID;
  v_parent_author   UUID;
  v_actor_name      TEXT;
  v_existing_id     UUID;
BEGIN
  SELECT nickname INTO v_actor_name
    FROM profiles WHERE user_id = NEW.user_id;

  IF NEW.parent_comment_id IS NULL THEN
    SELECT user_id INTO v_post_author
      FROM community_posts WHERE id = NEW.post_id;

    IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN
      RETURN NEW;
    END IF;

    INSERT INTO community_notifications
      (user_id, type, post_id, actor_name, actor_count, updated_at)
    VALUES
      (v_post_author, 'comment', NEW.post_id, v_actor_name, 1, now());

  ELSE
    SELECT user_id INTO v_parent_author
      FROM community_comments WHERE id = NEW.parent_comment_id;

    IF v_parent_author IS NULL OR v_parent_author = NEW.user_id THEN
      RETURN NEW;
    END IF;

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
CREATE OR REPLACE FUNCTION handle_community_notification_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url     TEXT;
  v_anon    TEXT;
BEGIN
  BEGIN
    v_url  := current_setting('app.supabase_url');
    v_anon := current_setting('app.anon_key');
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/send-community-push',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_anon
               ),
    body    := row_to_json(NEW)::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_notification_push ON community_notifications;
CREATE TRIGGER on_community_notification_push
  AFTER INSERT ON community_notifications
  FOR EACH ROW EXECUTE FUNCTION handle_community_notification_push();;
