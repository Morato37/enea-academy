/*
  # Add Tree of the Future Category

  1. Changes
    - Add `tree_of_the_future` boolean column to `plants_flat` table
    - Set default value to false
    - Update specific plant IDs to have tree_of_the_future = true
  
  2. Plant IDs with tree_of_the_future attribute:
    - 14, 33, 126, 131, 161, 253, 323, 342, 357, 358, 386, 394, 421, 429, 440, 450, 467, 469, 470, 473, 513, 539, 541
*/

-- Add the tree_of_the_future column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'tree_of_the_future'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN tree_of_the_future boolean DEFAULT false;
  END IF;
END $$;

-- Update the specified plant IDs
UPDATE plants_flat
SET tree_of_the_future = true
WHERE id IN (14, 33, 126, 131, 161, 253, 323, 342, 357, 358, 386, 394, 421, 429, 440, 450, 467, 469, 470, 473, 513, 539, 541);