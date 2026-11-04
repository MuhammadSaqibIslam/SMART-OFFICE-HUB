-- ============================================
-- EMPLOYEE PHOTOS
-- Adds an avatar_url column to employees and a public storage
-- bucket ("employee-photos") that authenticated users can manage.
-- ============================================

-- 1. Column to store the uploaded photo's public URL
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Storage bucket (public read so <img> can load the photo directly)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies
--    Anyone can view (bucket is public); only authenticated users can
--    upload / change / remove photos.
DROP POLICY IF EXISTS "Public read employee photos" ON storage.objects;
CREATE POLICY "Public read employee photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-photos');

DROP POLICY IF EXISTS "Auth upload employee photos" ON storage.objects;
CREATE POLICY "Auth upload employee photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-photos');

DROP POLICY IF EXISTS "Auth update employee photos" ON storage.objects;
CREATE POLICY "Auth update employee photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-photos');

DROP POLICY IF EXISTS "Auth delete employee photos" ON storage.objects;
CREATE POLICY "Auth delete employee photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-photos');
