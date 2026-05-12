/*
  # Add Honeybees Characteristic

  ## Overview
  This migration adds a new biodiversity characteristic to the plants_flat table:
  - characteristic_honeybees: Indicates if the plant attracts honeybees

  ## Changes
  1. New Column
    - `characteristic_honeybees` (boolean, default false) - Plants that attract honeybees

  ## Security
  - RLS policies remain unchanged
  - All existing policies apply to new column
*/

-- Add honeybees characteristic column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_honeybees'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_honeybees boolean DEFAULT false;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN plants_flat.characteristic_honeybees IS 'Indicates if the plant attracts honeybees (important pollinators)';
