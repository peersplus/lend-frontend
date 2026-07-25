
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_photo_url text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_photo_url text;

-- Storage RLS for 'photos' bucket
CREATE POLICY "photos: authenticated can read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'photos');

CREATE POLICY "photos: users upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "photos: users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "photos: users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
