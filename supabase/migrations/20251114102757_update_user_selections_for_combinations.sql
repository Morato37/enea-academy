/*
  # Update user_selections for tile-cobblestone combinations

  1. Schema Changes
    - Add `parent_selection_id` column to `user_selections` table
      - References another selection (for linking cobblestones to their tile)
      - Allows hierarchical structure: Tile -> Multiple Cobblestones
    
    - Add `is_tile_combination` boolean column
      - Indicates if this selection is part of a tile+cobblestone combination
      - Helps filter and display combinations properly
    
    - Add `combination_reference` text column
      - Optional reference/label for the combination
      - Can be used to group related selections

  2. Purpose
    - Support tile-cobblestone combinations in selections
    - When user selects a tile + cobblestones:
      * Tile is added as parent selection
      * Each cobblestone is added with parent_selection_id pointing to tile
      * All marked with is_tile_combination = true

  3. Example Structure
    ```
    Selection 1: Andeer Tile (parent_selection_id = NULL, is_tile_combination = true)
    Selection 2: Andeer Cobblestone (parent_selection_id = Selection 1 ID, is_tile_combination = true)
    Selection 3: Pietra Piasentina Cobblestone (parent_selection_id = Selection 1 ID, is_tile_combination = true)
    ```

  4. Indexes
    - Index on parent_selection_id for efficient lookups
    - Index on is_tile_combination for filtering
*/

-- Add parent_selection_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_selections' AND column_name = 'parent_selection_id'
  ) THEN
    ALTER TABLE user_selections ADD COLUMN parent_selection_id uuid REFERENCES user_selections(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add is_tile_combination column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_selections' AND column_name = 'is_tile_combination'
  ) THEN
    ALTER TABLE user_selections ADD COLUMN is_tile_combination boolean DEFAULT false;
  END IF;
END $$;

-- Add combination_reference column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_selections' AND column_name = 'combination_reference'
  ) THEN
    ALTER TABLE user_selections ADD COLUMN combination_reference text;
  END IF;
END $$;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_selections_parent ON user_selections(parent_selection_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_is_combination ON user_selections(is_tile_combination);
CREATE INDEX IF NOT EXISTS idx_user_selections_combination_ref ON user_selections(combination_reference);
