/*
  # Fix Tile Combination Child References

  1. Issue
    - After duplicating stones with category 'both' into separate 'tile' and 'cobblestone' records,
      some child selections in tile combinations are still pointing to tile stones instead of cobblestone stones
    
  2. Solution
    - Update child selections that point to tiles to point to their cobblestone equivalents
    - Match by stone name to find the correct cobblestone ID
*/

-- Update child selections to point to cobblestone versions instead of tile versions
UPDATE user_selections
SET stone_id = (
  SELECT cs.id 
  FROM stones cs
  WHERE cs.name = (SELECT s.name FROM stones s WHERE s.id = user_selections.stone_id)
    AND cs.stone_category = 'cobblestone'
  LIMIT 1
)
WHERE parent_selection_id IS NOT NULL
  AND stone_id IN (
    SELECT id FROM stones WHERE stone_category = 'tile'
  )
  AND EXISTS (
    SELECT 1 
    FROM stones s 
    WHERE s.id = user_selections.stone_id 
      AND s.stone_category = 'tile'
      AND EXISTS (
        SELECT 1 FROM stones cs 
        WHERE cs.name = s.name 
          AND cs.stone_category = 'cobblestone'
      )
  );
