/*
  # Add Matrix Approach column to plants_flat

  1. Changes
    - `plants_flat`: adds `matrix_approach` boolean column (default false)
      - Indicates whether a perennial plant is suitable for naturalistic/matrix planting design
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'matrix_approach'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN matrix_approach boolean DEFAULT false;
  END IF;
END $$;
