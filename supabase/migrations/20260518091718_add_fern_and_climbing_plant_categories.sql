/*
  # Add Ferns and Climbing Plants categories to plants_flat

  1. Changes
    - Add `category_fern` boolean column to plants_flat (default false)
    - Add `category_climbing_plant` boolean column to plants_flat (default false)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_fern'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_fern boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_climbing_plant'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_climbing_plant boolean NOT NULL DEFAULT false;
  END IF;
END $$;
