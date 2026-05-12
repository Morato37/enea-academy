/*
  # Add Image Storage Support

  1. Schema Changes
    - Add `image_url` column to `plants` table
    - Add `image_url` column to `stones` table
  
  2. Storage Buckets
    - Create `plant-images` bucket for plant photos
    - Create `stone-images` bucket for stone photos
  
  3. Security
    - Enable public read access to both buckets
    - Allow authenticated users to upload images
    - Images are accessible via public URLs
  
  4. Notes
    - Images will be stored in Supabase Storage
    - Each plant/stone can have one primary image
    - URLs will be in format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{filename}
*/

-- Add image_url columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE plants ADD COLUMN image_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE stones ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Create storage buckets for plant and stone images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('plant-images', 'plant-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('stone-images', 'stone-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for plant-images bucket
DROP POLICY IF EXISTS "Public read access for plant images" ON storage.objects;
CREATE POLICY "Public read access for plant images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'plant-images');

DROP POLICY IF EXISTS "Authenticated users can upload plant images" ON storage.objects;
CREATE POLICY "Authenticated users can upload plant images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plant-images');

DROP POLICY IF EXISTS "Authenticated users can update plant images" ON storage.objects;
CREATE POLICY "Authenticated users can update plant images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'plant-images')
  WITH CHECK (bucket_id = 'plant-images');

DROP POLICY IF EXISTS "Authenticated users can delete plant images" ON storage.objects;
CREATE POLICY "Authenticated users can delete plant images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'plant-images');

-- Storage policies for stone-images bucket
DROP POLICY IF EXISTS "Public read access for stone images" ON storage.objects;
CREATE POLICY "Public read access for stone images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'stone-images');

DROP POLICY IF EXISTS "Authenticated users can upload stone images" ON storage.objects;
CREATE POLICY "Authenticated users can upload stone images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stone-images');

DROP POLICY IF EXISTS "Authenticated users can update stone images" ON storage.objects;
CREATE POLICY "Authenticated users can update stone images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'stone-images')
  WITH CHECK (bucket_id = 'stone-images');

DROP POLICY IF EXISTS "Authenticated users can delete stone images" ON storage.objects;
CREATE POLICY "Authenticated users can delete stone images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stone-images');
