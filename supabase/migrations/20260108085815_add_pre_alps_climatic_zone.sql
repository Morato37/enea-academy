/*
  # Add Pre-Alps Climatic Zone
  
  1. Changes
    - Add `pre_alps_zone` column to stones table
    - Maps to Zones 6a, 6b
  
  2. Climatic Areas
    - Alpine: Zones 5a, 5b
    - Pre-Alps: Zones 6a, 6b
    - Central European: Zones 7a, 7b, 8a, 8b
    - Mediterranean: Zones 9a, 9b, 10a, 10b
*/

-- Add pre_alps_zone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'pre_alps_zone'
  ) THEN
    ALTER TABLE stones ADD COLUMN pre_alps_zone boolean DEFAULT false;
  END IF;
END $$;
