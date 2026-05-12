/*
  # Add Hoverflies and Beetles Characteristics

  ## Overview
  This migration adds two new biodiversity characteristics to the plants_flat table:
  - characteristic_hoverflies: Indicates if the plant attracts hoverflies
  - characteristic_beetles: Indicates if the plant attracts beetles

  ## Changes
  1. New Columns
    - `characteristic_hoverflies` (boolean, default false) - Plants that attract hoverflies
    - `characteristic_beetles` (boolean, default false) - Plants that attract beetles

  ## Security
  - RLS policies remain unchanged
  - All existing policies apply to new columns
*/

-- Add hoverflies characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_hoverflies'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_hoverflies boolean DEFAULT false;
  END IF;
END $$;

-- Add beetles characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_beetles'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_beetles boolean DEFAULT false;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN plants_flat.characteristic_hoverflies IS 'Indicates if the plant attracts hoverflies (beneficial pollinators and pest controllers)';
COMMENT ON COLUMN plants_flat.characteristic_beetles IS 'Indicates if the plant attracts beetles (beneficial pollinators and decomposers)';
