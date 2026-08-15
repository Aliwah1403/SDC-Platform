
-- Public bucket for community post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
CREATE POLICY "community_images_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone authenticated can read (public community feed)
CREATE POLICY "community_images_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'community-images');

-- Authors can delete their own images
CREATE POLICY "community_images_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
;
