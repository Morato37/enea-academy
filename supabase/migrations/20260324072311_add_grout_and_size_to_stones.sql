/*
  # Add Grout and Size fields to stones table

  1. Changes
    - Add `grout` column (text) to stones table for grout information
    - Add `size` column (text) to stones table for size specifications
  
  2. Notes
    - Both fields are optional text fields
    - No default values specified to allow NULL for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'grout'
  ) THEN
    ALTER TABLE stones ADD COLUMN grout text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'size'
  ) THEN
    ALTER TABLE stones ADD COLUMN size text;
  END IF;
END $$;
