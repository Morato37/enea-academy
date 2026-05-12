/*
  # Stone Categories and Combinations System

  1. Schema Changes
    - Add `stone_category` column to `stones` table
      - Values: 'tile', 'cobblestone', 'both', or NULL
      - Allows categorization of stones by their primary use type
    
    - Create new `stone_combinations` table
      - Links tiles with their compatible cobblestones
      - Supports multiple cobblestones per tile
      - Tracks display order for consistent UI presentation
      - Stores optional combination names and descriptions

  2. New Table: stone_combinations
    - `id` (uuid, primary key)
    - `tile_stone_id` (integer, foreign key to stones)
    - `cobblestone_stone_id` (integer, foreign key to stones)
    - `combination_name` (text, optional descriptive name)
    - `display_order` (integer, for sorting cobblestones)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  3. Security
    - Enable RLS on `stone_combinations` table
    - Add policies for authenticated users to read combinations
    - Only admins can manage combinations (using user_profiles table)

  4. Indexes
    - Index on `stones.stone_category` for faster filtering
    - Index on `stone_combinations.tile_stone_id` for efficient lookups
    - Index on `stone_combinations.cobblestone_stone_id` for reverse lookups
*/

-- Add stone_category column to stones table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stones' AND column_name = 'stone_category'
  ) THEN
    ALTER TABLE stones ADD COLUMN stone_category text;
  END IF;
END $$;

-- Create index on stone_category
CREATE INDEX IF NOT EXISTS idx_stones_category ON stones(stone_category);

-- Create stone_combinations table
CREATE TABLE IF NOT EXISTS stone_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_stone_id integer NOT NULL REFERENCES stones(id) ON DELETE CASCADE,
  cobblestone_stone_id integer NOT NULL REFERENCES stones(id) ON DELETE CASCADE,
  combination_name text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure a tile-cobblestone pair is unique
  UNIQUE(tile_stone_id, cobblestone_stone_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_combinations_tile ON stone_combinations(tile_stone_id);
CREATE INDEX IF NOT EXISTS idx_combinations_cobblestone ON stone_combinations(cobblestone_stone_id);

-- Enable RLS on stone_combinations
ALTER TABLE stone_combinations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view stone combinations
CREATE POLICY "Anyone can view stone combinations"
  ON stone_combinations FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert combinations
CREATE POLICY "Admins can insert stone combinations"
  ON stone_combinations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update combinations
CREATE POLICY "Admins can update stone combinations"
  ON stone_combinations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete combinations
CREATE POLICY "Admins can delete stone combinations"
  ON stone_combinations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_stone_combinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stone_combinations_updated_at
  BEFORE UPDATE ON stone_combinations
  FOR EACH ROW
  EXECUTE FUNCTION update_stone_combinations_updated_at();
