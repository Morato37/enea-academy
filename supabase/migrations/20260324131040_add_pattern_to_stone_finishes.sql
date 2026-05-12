/*
  # Add Pattern Attribute to Stone Finishes

  1. Changes
    - Add `pattern` column to stone_finishes table
      - `pattern` (text) - pattern specification for the finish

  2. Notes
    - This allows specifying pattern details for each finish type
    - No security changes needed as existing RLS policies cover this column
*/

-- Add pattern column to stone_finishes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stone_finishes' AND column_name = 'pattern'
  ) THEN
    ALTER TABLE stone_finishes ADD COLUMN pattern text;
  END IF;
END $$;
