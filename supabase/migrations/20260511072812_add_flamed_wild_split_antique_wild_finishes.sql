/*
  # Add new finish types: flamed wild and split antique wild

  1. Changes
    - `stones` table: add `finish_flamed_wild` (boolean) column
    - `stones` table: add `finish_split_antique_wild` (boolean) column

  2. Notes
    - Both columns default to false, consistent with existing finish columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'finish_flamed_wild'
  ) THEN
    ALTER TABLE stones ADD COLUMN finish_flamed_wild boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'finish_split_antique_wild'
  ) THEN
    ALTER TABLE stones ADD COLUMN finish_split_antique_wild boolean DEFAULT false;
  END IF;
END $$;
