/*
  # Fix plant_images Foreign Key Reference

  1. Problem
    - The `plant_images` table references `plants(id)` but that table was dropped
    - The new table is `plants_flat` with the same ID structure
  
  2. Changes
    - Drop the old foreign key constraint from `plant_images`
    - Add new foreign key constraint pointing to `plants_flat(id)`
    - Ensure CASCADE delete behavior is preserved
  
  3. Security
    - No changes to RLS policies (they remain the same)
  
  4. Notes
    - This migration is idempotent - safe to run multiple times
    - Existing data in `plant_images` is preserved
    - The ID values remain compatible between old `plants` and new `plants_flat`
*/

-- First, check if plant_images table exists and drop old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'plant_images'
  ) THEN
    -- Drop the old foreign key constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'plant_images_plant_id_fkey' 
      AND table_name = 'plant_images'
    ) THEN
      ALTER TABLE plant_images DROP CONSTRAINT plant_images_plant_id_fkey;
    END IF;
    
    -- Add the new foreign key constraint pointing to plants_flat
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'plant_images_plant_id_fkey_plants_flat' 
      AND table_name = 'plant_images'
    ) THEN
      ALTER TABLE plant_images 
      ADD CONSTRAINT plant_images_plant_id_fkey_plants_flat 
      FOREIGN KEY (plant_id) 
      REFERENCES plants_flat(id) 
      ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create an index on plant_id if it doesn't exist (for performance)
CREATE INDEX IF NOT EXISTS idx_plant_images_plant_id_v2 ON plant_images(plant_id);
