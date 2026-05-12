/*
  # Add Multiple Images Support

  1. Schema Changes
    - Create `plant_images` table to store multiple images per plant
    - Create `stone_images` table to store multiple images per stone
  
  2. Tables
    - `plant_images`
      - `id` (uuid, primary key)
      - `plant_id` (integer, foreign key to plants)
      - `image_url` (text, URL to the image)
      - `display_order` (integer, for ordering images)
      - `created_at` (timestamptz)
    - `stone_images`
      - `id` (uuid, primary key)
      - `stone_id` (integer, foreign key to stones)
      - `image_url` (text, URL to the image)
      - `display_order` (integer, for ordering images)
      - `created_at` (timestamptz)
  
  3. Security
    - Enable RLS on both tables
    - Allow public read access
    - Allow authenticated users to insert/update/delete
  
  4. Notes
    - Keeps the existing `image_url` column in plants/stones for backward compatibility
    - The first image in plant_images/stone_images can be considered the primary image
    - Images are ordered by `display_order` field
*/

-- Create plant_images table
CREATE TABLE IF NOT EXISTS plant_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id integer NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create stone_images table
CREATE TABLE IF NOT EXISTS stone_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stone_id integer NOT NULL REFERENCES stones(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stone_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plant_images
DROP POLICY IF EXISTS "Public can view plant images" ON plant_images;
CREATE POLICY "Public can view plant images"
  ON plant_images FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert plant images" ON plant_images;
CREATE POLICY "Authenticated users can insert plant images"
  ON plant_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update plant images" ON plant_images;
CREATE POLICY "Authenticated users can update plant images"
  ON plant_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete plant images" ON plant_images;
CREATE POLICY "Authenticated users can delete plant images"
  ON plant_images FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for stone_images
DROP POLICY IF EXISTS "Public can view stone images" ON stone_images;
CREATE POLICY "Public can view stone images"
  ON stone_images FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert stone images" ON stone_images;
CREATE POLICY "Authenticated users can insert stone images"
  ON stone_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update stone images" ON stone_images;
CREATE POLICY "Authenticated users can update stone images"
  ON stone_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete stone images" ON stone_images;
CREATE POLICY "Authenticated users can delete stone images"
  ON stone_images FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_plant_images_plant_id ON plant_images(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_images_display_order ON plant_images(plant_id, display_order);
CREATE INDEX IF NOT EXISTS idx_stone_images_stone_id ON stone_images(stone_id);
CREATE INDEX IF NOT EXISTS idx_stone_images_display_order ON stone_images(stone_id, display_order);
