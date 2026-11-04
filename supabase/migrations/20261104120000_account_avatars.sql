-- Review before application. Private profile photos are owned by UUID folder.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 2097152, ARRAY['image/webp']);

CREATE POLICY "Owners can read avatars" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
CREATE POLICY "Owners can upload avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
CREATE POLICY "Owners can delete avatars" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
COMMIT;
