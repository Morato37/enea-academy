/*
  # Add Tuberous-rooted Usage Category

  1. Changes
    - Add `usage_tuberous_rooted` boolean column to plants_flat table
    - Default value is false
  
  2. Purpose
    - Enable categorization of plants with tuberous roots under Perennials usage types
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'usage_tuberous_rooted'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN usage_tuberous_rooted boolean DEFAULT false;
  END IF;
END $$;
