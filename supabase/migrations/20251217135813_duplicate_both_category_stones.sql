/*
  # Duplicate Stones with Category "Both"

  1. Changes
    - Find all stones with stone_category = 'both'
    - Update existing records to have stone_category = 'tile'
    - Create duplicate records with stone_category = 'cobblestone' and no image_url
    
  2. Process
    - Reset the sequence to avoid ID conflicts
    - For each stone with category 'both':
      - Keep the original record as 'tile'
      - Create a new duplicate with 'cobblestone' category (new auto-generated id)
      - Remove image_url from the cobblestone duplicate
*/

-- Reset the sequence to avoid conflicts
SELECT setval('stones_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM stones), false);

-- Create duplicates with cobblestone category (without images)
-- Note: id is not included, so it will auto-generate new ids
INSERT INTO stones (
  name,
  morphology,
  producer_seller,
  origin,
  stone_color,
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
  finish_blasted,
  finish_sawn,
  finish_hammered,
  finish_brushed,
  finish_polished,
  finish_honed,
  frost_resistant,
  less_frost_resistant,
  not_frost_resistant,
  stone_category,
  image_url
)
SELECT 
  name,
  morphology,
  producer_seller,
  origin,
  stone_color,
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
  finish_blasted,
  finish_sawn,
  finish_hammered,
  finish_brushed,
  finish_polished,
  finish_honed,
  frost_resistant,
  less_frost_resistant,
  not_frost_resistant,
  'cobblestone' as stone_category,
  NULL as image_url
FROM stones
WHERE stone_category = 'both';

-- Update existing 'both' records to 'tile'
UPDATE stones
SET stone_category = 'tile'
WHERE stone_category = 'both';
