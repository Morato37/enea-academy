/*
  # Fix Stone Combinations Cobblestone References

  1. Issue
    - The stone_combinations table has cobblestone_stone_id pointing to tile versions
    - After splitting stones with category 'both' into separate 'tile' and 'cobblestone' records,
      the stone_combinations table still references the old tile IDs in the cobblestone_stone_id column
    
  2. Solution
    - Update cobblestone_stone_id to point to cobblestone versions where they exist
    - Match by stone name to find the correct cobblestone ID
*/

-- Update stone_combinations to point to cobblestone versions instead of tile versions
UPDATE stone_combinations
SET cobblestone_stone_id = (
  SELECT cs.id 
  FROM stones cs
  WHERE cs.name = (SELECT s.name FROM stones s WHERE s.id = stone_combinations.cobblestone_stone_id)
    AND cs.stone_category = 'cobblestone'
  LIMIT 1
)
WHERE cobblestone_stone_id IN (
  SELECT id FROM stones WHERE stone_category = 'tile'
)
AND EXISTS (
  SELECT 1 
  FROM stones s 
  WHERE s.id = stone_combinations.cobblestone_stone_id 
    AND s.stone_category = 'tile'
    AND EXISTS (
      SELECT 1 FROM stones cs 
      WHERE cs.name = s.name 
        AND cs.stone_category = 'cobblestone'
    )
);
