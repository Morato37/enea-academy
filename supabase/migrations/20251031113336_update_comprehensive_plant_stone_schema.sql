/*
  # Comprehensive Plant and Stone Database Schema

  1. Tables
    - `plants` - Complete plant database with all attributes from CSV
      - Basic info: botanical name, common names (EN/DE), category
      - Type attributes: shrub, tree, perennial, annual, biannual, grass, succulent, bulb, aquatic, non-vascular
      - Light: sun, shade, half shade
      - Soil: sandy, clay, loamy
      - Usage: solitary tree, trees in groups, ground cover, seasonal, climbing, hedge, wild hedge
      - Climate zones: 5a through 10b
      - Monthly colors: hex codes for each month (Jan-Dec)
      - Traits and variations
    
    - `stones` - Complete stone database
      - Basic info: name, morphology, producer/seller, origin, color
      - Climate zones: Mediterranean, Central-Europe, Alpine
      - Usage: tiles, block steps, paving, walls, pool, chippings
      - Finishes: split, flamed, blasted, sawn, hammered, brushed, polished, honed
      - Resistance: frost resistant, less frost resistant, not frost resistant

  2. Security
    - Enable RLS on both tables
    - Public read access for all users
    - Admin-only write access

  3. Indexes
    - Optimize for common search patterns
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS plants CASCADE;
DROP TABLE IF EXISTS stones CASCADE;

-- Create plants table with comprehensive schema
CREATE TABLE IF NOT EXISTS plants (
  id SERIAL PRIMARY KEY,
  botanical_name TEXT NOT NULL,
  common_name_en TEXT,
  common_name_de TEXT,
  
  -- Category/Type (mutually exclusive or combined)
  is_shrub BOOLEAN DEFAULT false,
  is_tree BOOLEAN DEFAULT false,
  is_perennial BOOLEAN DEFAULT false,
  is_annual BOOLEAN DEFAULT false,
  is_biannual BOOLEAN DEFAULT false,
  is_grass BOOLEAN DEFAULT false,
  is_succulent BOOLEAN DEFAULT false,
  is_bulb BOOLEAN DEFAULT false,
  is_aquatic BOOLEAN DEFAULT false,
  is_non_vascular BOOLEAN DEFAULT false,
  
  -- Light requirements
  needs_sun BOOLEAN DEFAULT false,
  needs_shade BOOLEAN DEFAULT false,
  needs_half_shade BOOLEAN DEFAULT false,
  
  -- Soil requirements
  soil_sandy BOOLEAN DEFAULT false,
  soil_clay BOOLEAN DEFAULT false,
  soil_loamy BOOLEAN DEFAULT false,
  
  -- Usage
  use_solitary_tree BOOLEAN DEFAULT false,
  use_trees_in_groups BOOLEAN DEFAULT false,
  use_ground_cover BOOLEAN DEFAULT false,
  use_seasonal BOOLEAN DEFAULT false,
  use_climbing BOOLEAN DEFAULT false,
  use_hedge BOOLEAN DEFAULT false,
  use_wild_hedge BOOLEAN DEFAULT false,
  
  -- Climate zones (USDA Hardiness Zones)
  zone_5a BOOLEAN DEFAULT false,
  zone_5b BOOLEAN DEFAULT false,
  zone_6a BOOLEAN DEFAULT false,
  zone_6b BOOLEAN DEFAULT false,
  zone_7a BOOLEAN DEFAULT false,
  zone_7b BOOLEAN DEFAULT false,
  zone_8a BOOLEAN DEFAULT false,
  zone_8b BOOLEAN DEFAULT false,
  zone_9a BOOLEAN DEFAULT false,
  zone_9b BOOLEAN DEFAULT false,
  zone_10a BOOLEAN DEFAULT false,
  zone_10b BOOLEAN DEFAULT false,
  
  -- Monthly colors (hex codes)
  color_jan TEXT,
  color_feb TEXT,
  color_mar TEXT,
  color_apr TEXT,
  color_may TEXT,
  color_jun TEXT,
  color_jul TEXT,
  color_aug TEXT,
  color_sep TEXT,
  color_oct TEXT,
  color_nov TEXT,
  color_dec TEXT,
  
  -- Additional attributes
  traits_vary_by_location BOOLEAN DEFAULT false,
  traits_vary_annual_perennial BOOLEAN DEFAULT false,
  has_different_bloom_colors BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create stones table with comprehensive schema
CREATE TABLE IF NOT EXISTS stones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  morphology TEXT,
  producer_seller TEXT,
  origin TEXT,
  stone_color TEXT,
  
  -- Climatic areas
  mediterranean_zone BOOLEAN DEFAULT false,
  central_europe_zone BOOLEAN DEFAULT false,
  alpine_zone BOOLEAN DEFAULT false,
  
  -- Usage
  use_tiles BOOLEAN DEFAULT false,
  use_block_steps BOOLEAN DEFAULT false,
  use_paving BOOLEAN DEFAULT false,
  use_walls BOOLEAN DEFAULT false,
  use_pool BOOLEAN DEFAULT false,
  use_chippings BOOLEAN DEFAULT false,
  
  -- Finishes
  finish_split BOOLEAN DEFAULT false,
  finish_flamed BOOLEAN DEFAULT false,
  finish_blasted BOOLEAN DEFAULT false,
  finish_sawn BOOLEAN DEFAULT false,
  finish_hammered BOOLEAN DEFAULT false,
  finish_brushed BOOLEAN DEFAULT false,
  finish_polished BOOLEAN DEFAULT false,
  finish_honed BOOLEAN DEFAULT false,
  
  -- Resistance
  frost_resistant BOOLEAN DEFAULT false,
  less_frost_resistant BOOLEAN DEFAULT false,
  not_frost_resistant BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stones ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read plants"
  ON plants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read stones"
  ON stones FOR SELECT
  TO public
  USING (true);

-- Admin write policies (authenticated users only - adjust as needed)
CREATE POLICY "Authenticated users can insert plants"
  ON plants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update plants"
  ON plants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete plants"
  ON plants FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stones"
  ON stones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stones"
  ON stones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stones"
  ON stones FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_plants_botanical_name ON plants(botanical_name);
CREATE INDEX IF NOT EXISTS idx_plants_type ON plants(is_shrub, is_tree, is_perennial, is_grass);
CREATE INDEX IF NOT EXISTS idx_plants_light ON plants(needs_sun, needs_shade, needs_half_shade);
CREATE INDEX IF NOT EXISTS idx_stones_name ON stones(name);
CREATE INDEX IF NOT EXISTS idx_stones_color ON stones(stone_color);
CREATE INDEX IF NOT EXISTS idx_stones_morphology ON stones(morphology);
