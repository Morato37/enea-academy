/*
  # Restructure Stone Finishes with Attributes

  1. New Tables
    - `stone_finishes` - Store finish details per stone
      - `id` (bigserial, primary key)
      - `stone_id` (bigint, foreign key to stones)
      - `finish_type` (text) - split, flamed, polished, etc.
      - `image_url` (text) - finish image URL
      - `grout` (text) - grout specification
      - `size` (text) - size specification
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Remove `grout` and `size` columns from stones table
    - Migrate existing finish images to new structure
  
  3. Security
    - Enable RLS on stone_finishes table
    - Add policies for authenticated users to read finish data
    - Add policies for admin users to manage finish data
*/

-- Create stone_finishes table
CREATE TABLE IF NOT EXISTS stone_finishes (
  id bigserial PRIMARY KEY,
  stone_id bigint NOT NULL REFERENCES stones(id) ON DELETE CASCADE,
  finish_type text NOT NULL,
  image_url text,
  grout text,
  size text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(stone_id, finish_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stone_finishes_stone_id ON stone_finishes(stone_id);
CREATE INDEX IF NOT EXISTS idx_stone_finishes_finish_type ON stone_finishes(finish_type);

-- Enable RLS
ALTER TABLE stone_finishes ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to read finish data
CREATE POLICY "Authenticated users can read stone finishes"
  ON stone_finishes FOR SELECT
  TO authenticated
  USING (true);

-- Policies for admin users to manage finish data
CREATE POLICY "Admin users can insert stone finishes"
  ON stone_finishes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update stone finishes"
  ON stone_finishes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete stone finishes"
  ON stone_finishes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Migrate existing finish images to new structure
DO $$
DECLARE
  stone_record RECORD;
  finish_types TEXT[] := ARRAY['split', 'flamed', 'blasted', 'sawn', 'hammered', 'brushed', 'polished', 'honed'];
  v_finish_type TEXT;
  image_url_column TEXT;
  v_image_url TEXT;
BEGIN
  FOR stone_record IN SELECT id FROM stones LOOP
    FOREACH v_finish_type IN ARRAY finish_types LOOP
      image_url_column := 'finish_' || v_finish_type || '_image_url';
      
      EXECUTE format('SELECT %I FROM stones WHERE id = $1', image_url_column)
      INTO v_image_url
      USING stone_record.id;
      
      IF v_image_url IS NOT NULL THEN
        INSERT INTO stone_finishes (stone_id, finish_type, image_url)
        VALUES (stone_record.id, v_finish_type, v_image_url)
        ON CONFLICT (stone_id, finish_type) DO UPDATE
        SET image_url = EXCLUDED.image_url;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Remove grout and size from stones table if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'grout'
  ) THEN
    ALTER TABLE stones DROP COLUMN grout;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'size'
  ) THEN
    ALTER TABLE stones DROP COLUMN size;
  END IF;
END $$;
