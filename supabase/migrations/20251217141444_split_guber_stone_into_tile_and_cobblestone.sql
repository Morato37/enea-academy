/*
  # Split Guber Stone into Tile and Cobblestone

  1. Issue
    - Guber stone has category 'both' which causes it to appear in both tiles and cobblestones
    - This creates confusion in tile combinations and selections
    
  2. Solution
    - Update the original Guber record to be category 'tile' (with image)
    - Create a new Guber record with category 'cobblestone' (without image)
    - Update stone_combinations to reference the cobblestone version
    - Update any existing user selections that use Guber as a cobblestone child
*/

-- First, update the original Guber to be 'tile'
UPDATE stones
SET stone_category = 'tile'
WHERE name = 'Guber' AND stone_category = 'both';

-- Create the cobblestone version of Guber (without image)
INSERT INTO stones (
  name, 
  morphology, 
  origin, 
  stone_color, 
  producer_seller, 
  mediterranean_zone,
  central_europe_zone,
  alpine_zone,
  use_tiles,
  use_block_steps,
  use_paving,
  use_walls,
  use_pool,
  use_chippings,
  finish_split,
  finish_flamed,
  finish_polished,
  finish_honed,
  finish_brushed,
  finish_hammered,
  finish_sawn,
  finish_blasted,
  frost_resistant,
  less_frost_resistant,
  not_frost_resistant,
  stone_category,
  image_url
)
SELECT 
  name,
  morphology,
  origin,
  stone_color,
  producer_seller,
  mediterranean_zone,
  central_europe_zone,
  alpine_zone,
  use_tiles,
  use_block_steps,
  use_paving,
  use_walls,
  use_pool,
  use_chippings,
  finish_split,
  finish_flamed,
  finish_polished,
  finish_honed,
  finish_brushed,
  finish_hammered,
  finish_sawn,
  finish_blasted,
  frost_resistant,
  less_frost_resistant,
  not_frost_resistant,
  'cobblestone'::text,
  NULL  -- No image for cobblestone version
FROM stones
WHERE name = 'Guber' AND stone_category = 'tile';

-- Update stone_combinations to point to the new cobblestone version
UPDATE stone_combinations
SET cobblestone_stone_id = (
  SELECT id FROM stones WHERE name = 'Guber' AND stone_category = 'cobblestone' LIMIT 1
)
WHERE cobblestone_stone_id = (
  SELECT id FROM stones WHERE name = 'Guber' AND stone_category = 'tile' LIMIT 1
);

-- Update existing user selections that have Guber as a child (cobblestone)
UPDATE user_selections
SET stone_id = (
  SELECT id FROM stones WHERE name = 'Guber' AND stone_category = 'cobblestone' LIMIT 1
)
WHERE parent_selection_id IS NOT NULL
  AND stone_id = (
    SELECT id FROM stones WHERE name = 'Guber' AND stone_category = 'tile' LIMIT 1
  );
