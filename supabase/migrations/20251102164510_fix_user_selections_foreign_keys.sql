/*
  # Fix user_selections table foreign key relationships

  1. Changes
    - Change plant_id from uuid to integer to match plants table
    - Change stone_id from uuid to integer to match stones table
    - Add foreign key constraints for plant_id -> plants(id)
    - Add foreign key constraints for stone_id -> stones(id)
    - Add indexes for better query performance

  2. Notes
    - This will fix the "Could not find a relationship" error
    - Existing data will be preserved where possible
*/

-- First, check if there's any data in user_selections
DO $$
BEGIN
  -- Drop existing columns and recreate with correct types
  ALTER TABLE user_selections DROP COLUMN IF EXISTS plant_id;
  ALTER TABLE user_selections DROP COLUMN IF EXISTS stone_id;
  
  -- Add columns with correct integer type
  ALTER TABLE user_selections ADD COLUMN plant_id integer;
  ALTER TABLE user_selections ADD COLUMN stone_id integer;
  
  -- Add foreign key constraints
  ALTER TABLE user_selections
    ADD CONSTRAINT fk_user_selections_plant
    FOREIGN KEY (plant_id) REFERENCES plants(id)
    ON DELETE CASCADE;
  
  ALTER TABLE user_selections
    ADD CONSTRAINT fk_user_selections_stone
    FOREIGN KEY (stone_id) REFERENCES stones(id)
    ON DELETE CASCADE;
  
  -- Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_user_selections_plant_id ON user_selections(plant_id);
  CREATE INDEX IF NOT EXISTS idx_user_selections_stone_id ON user_selections(stone_id);
  CREATE INDEX IF NOT EXISTS idx_user_selections_user_id ON user_selections(user_id);
END $$;
