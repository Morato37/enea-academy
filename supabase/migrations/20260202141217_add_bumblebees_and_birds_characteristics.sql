/*
  # Add Bumblebees and Birds Characteristics

  1. Changes
    - Add `characteristic_bumblebees` boolean column to plants_flat table
    - Add `characteristic_birds` boolean column to plants_flat table
    - Both new columns default to false

  2. Purpose
    - Allow separate filtering for plants that attract bumblebees
    - Allow separate filtering for plants that attract birds
    - Provides more granular control over wildlife attraction preferences
*/

-- Add bumblebees characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_bumblebees'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_bumblebees boolean DEFAULT false;
  END IF;
END $$;

-- Add birds characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_birds'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_birds boolean DEFAULT false;
  END IF;
END $$;