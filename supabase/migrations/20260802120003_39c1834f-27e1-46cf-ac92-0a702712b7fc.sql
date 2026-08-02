CREATE POLICY "media readable" ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id IN ('avatars','reels'));

CREATE POLICY "own media upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('avatars','reels') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own media update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('avatars','reels') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own media delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('avatars','reels') AND (storage.foldername(name))[1] = auth.uid()::text);