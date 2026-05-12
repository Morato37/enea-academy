/*
  # Fix plants_flat ID auto-increment
  
  1. Changes
    - Create a sequence for plants_flat id column
    - Set the sequence as default value for id column
    - Set the sequence to start from the current max id + 1
  
  2. Notes
    - This allows creating new plants without manually specifying an id
    - Existing plants are not affected
*/

-- Create sequence if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'plants_flat_id_seq') THEN
    CREATE SEQUENCE plants_flat_id_seq;
  END IF;
END $$;

-- Set the sequence to start from max id + 1
SELECT setval('plants_flat_id_seq', COALESCE((SELECT MAX(id) FROM plants_flat), 0) + 1, false);

-- Set the default value for id column
ALTER TABLE plants_flat ALTER COLUMN id SET DEFAULT nextval('plants_flat_id_seq');

-- Set the sequence owner to the id column
ALTER SEQUENCE plants_flat_id_seq OWNED BY plants_flat.id;
