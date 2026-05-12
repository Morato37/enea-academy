/*
  # Allow Duplicate Finish Names

  1. Changes
    - Remove UNIQUE constraint on (stone_id, finish_type) to allow multiple finishes with the same name
    - Keep stone_id reference and indexes intact

  2. Notes
    - This allows creating multiple finishes with the same name (e.g., two "Flamed" finishes)
    - Each finish is still uniquely identified by its `id` column
*/

-- Drop the unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stone_finishes_stone_id_finish_type_key'
    AND conrelid = 'stone_finishes'::regclass
  ) THEN
    ALTER TABLE stone_finishes DROP CONSTRAINT stone_finishes_stone_id_finish_type_key;
  END IF;
END $$;
