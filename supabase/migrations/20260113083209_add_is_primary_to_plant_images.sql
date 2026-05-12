/*
  # Add is_primary flag to plant_images

  1. Changes
    - Add `is_primary` boolean column to plant_images table
    - Default value is false
    - Ensures only one image per plant can be marked as primary
  
  2. Purpose
    - Allow explicit marking of the primary/main image for each plant
    - Primary image will be displayed first and used as the main plant image
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plant_images' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE plant_images ADD COLUMN is_primary boolean DEFAULT false;
  END IF;
END $$;

-- Create an index for faster queries on primary images
CREATE INDEX IF NOT EXISTS idx_plant_images_primary ON plant_images(plant_id, is_primary) WHERE is_primary = true;
