
-- 1. Backfill profile for any auth user who posted but has no profile row
INSERT INTO profiles (user_id, full_name, email)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email
FROM auth.users au
WHERE au.id IN (SELECT DISTINCT user_id FROM community_posts)
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = au.id)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Re-point community_posts.user_id FK -> profiles.user_id
--    (profiles.user_id is UNIQUE, so this is a valid FK target)
ALTER TABLE community_posts
  DROP CONSTRAINT community_posts_user_id_fkey,
  ADD CONSTRAINT community_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 3. Re-point community_comments.user_id FK -> profiles.user_id
ALTER TABLE community_comments
  DROP CONSTRAINT community_comments_user_id_fkey,
  ADD CONSTRAINT community_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
;
