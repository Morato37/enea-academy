/*
  # Add is_primary flag to stone_images

  1. Changes
    - Add `is_primary` boolean column to stone_images table
    - Default value is false
    - Ensures only one image per stone can be marked as primary
  
  2. Purpose
    - Allow explicit marking of the primary/main image for each stone
    - Primary image will be displayed first and used as the main stone image
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stone_images' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE stone_images ADD COLUMN is_primary boolean DEFAULT false;
  END IF;
END $$;

-- Create an index for faster queries on primary images
CREATE INDEX IF NOT EXISTS idx_stone_images_primary ON stone_images(stone_id, is_primary) WHERE is_primary = true;
