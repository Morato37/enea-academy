/*
  # Add Native and Butterflies & Bees Characteristics

  1. Changes
    - Add `characteristic_native` boolean column to plants_flat table
    - Add `characteristic_butterflies_and_bees` boolean column to plants_flat table
    - Both columns default to false
  
  2. Purpose
    - Allow filtering plants by native species status
    - Allow filtering plants that attract butterflies and bees
*/

-- Add native characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_native'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_native boolean DEFAULT false;
  END IF;
END $$;

-- Add butterflies and bees characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_butterflies_and_bees'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_butterflies_and_bees boolean DEFAULT false;
  END IF;
END $$;
