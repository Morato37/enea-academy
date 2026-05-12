/*
  # Split Butterflies and Bees into Separate Characteristics

  1. Changes
    - Remove `characteristic_butterflies_and_bees` column from plants_flat table
    - Add `characteristic_butterflies` boolean column to plants_flat table
    - Add `characteristic_bees` boolean column to plants_flat table
    - Both new columns default to false
  
  2. Purpose
    - Allow separate filtering for plants that attract butterflies
    - Allow separate filtering for plants that attract bees
    - Provides more granular control over pollinator preferences
*/

-- Drop the combined characteristic column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_butterflies_and_bees'
  ) THEN
    ALTER TABLE plants_flat DROP COLUMN characteristic_butterflies_and_bees;
  END IF;
END $$;

-- Add butterflies characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_butterflies'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_butterflies boolean DEFAULT false;
  END IF;
END $$;

-- Add bees characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_bees'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_bees boolean DEFAULT false;
  END IF;
END $$;
