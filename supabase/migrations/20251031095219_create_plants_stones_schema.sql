/*
  # Landscape Architecture Catalog Database Schema

  ## Overview
  This migration creates the complete database schema for a landscape architecture
  tool that manages plants and stones catalogs with user selections and authentication.

  ## New Tables

  ### 1. plants
  Comprehensive plant catalog with botanical information, climate zones, and seasonal characteristics.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `botanical_name` (text) - Scientific name of the plant
  - `common_name_de` (text) - German common name
  - `common_name_en` (text) - English common name
  - `plant_type` (text) - Type category (tree, shrub, perennial, etc.)
  - `climate_zones` (text[]) - Array of applicable climate zones
  - `height_min_cm` (integer) - Minimum height in centimeters
  - `height_max_cm` (integer) - Maximum height in centimeters
  - `width_min_cm` (integer) - Minimum width in centimeters
  - `width_max_cm` (integer) - Maximum width in centimeters
  - `sun_requirements` (text) - Sun exposure needs (full sun, partial shade, shade)
  - `soil_type` (text[]) - Array of suitable soil types
  - `soil_moisture` (text) - Moisture requirements
  - `soil_ph` (text) - pH requirements
  - `growth_rate` (text) - Growth speed classification
  - `evergreen` (boolean) - Whether plant is evergreen
  - `native_region` (text) - Geographic origin
  - `usage_categories` (text[]) - Array of usage types (hedge, specimen, groundcover, etc.)
  - `seasonal_colors` (jsonb) - Monthly color data in JSON format
  - `flower_color` (text[]) - Array of flower colors
  - `flower_period` (text) - Blooming season
  - `foliage_color` (text[]) - Array of foliage colors
  - `fall_color` (text[]) - Autumn foliage color
  - `fruit_ornamental` (boolean) - Whether fruit is ornamental
  - `fragrance` (boolean) - Whether plant is fragrant
  - `attracts_wildlife` (text[]) - Wildlife attracted (birds, bees, butterflies)
  - `deer_resistant` (boolean) - Resistance to deer
  - `drought_tolerant` (boolean) - Drought tolerance
  - `salt_tolerant` (boolean) - Salt tolerance
  - `maintenance_level` (text) - Required maintenance level
  - `special_features` (text[]) - Notable characteristics
  - `planting_tips` (text) - Planting advice
  - `care_instructions` (text) - Care guidelines
  - `image_url` (text) - Primary image URL
  - `image_gallery` (text[]) - Array of additional image URLs
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. stones
  Stone and hardscape materials catalog with specifications and applications.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Stone product name
  - `stone_type` (text) - Category (natural stone, gravel, cobblestone, etc.)
  - `origin` (text) - Geographic source
  - `color_primary` (text) - Main color
  - `color_secondary` (text[]) - Additional colors
  - `morphology` (text) - Physical form (round, angular, flat, etc.)
  - `size_min_mm` (integer) - Minimum size in millimeters
  - `size_max_mm` (integer) - Maximum size in millimeters
  - `surface_treatment` (text[]) - Processing types (polished, honed, bush-hammered, etc.)
  - `climate_zones` (text[]) - Suitable climate zones
  - `frost_resistant` (boolean) - Frost resistance
  - `slip_resistant` (boolean) - Slip resistance rating
  - `applications` (text[]) - Use cases (paving, wall, garden bed, etc.)
  - `indoor_use` (boolean) - Suitable for indoor use
  - `outdoor_use` (boolean) - Suitable for outdoor use
  - `density_kg_m3` (integer) - Material density
  - `water_absorption_percent` (decimal) - Water absorption rate
  - `compressive_strength_mpa` (integer) - Compression strength
  - `abrasion_resistance` (text) - Wear resistance rating
  - `maintenance_requirements` (text) - Care needs
  - `sealing_recommended` (boolean) - Whether sealing is recommended
  - `producer_seller` (text) - Manufacturer or supplier
  - `price_category` (text) - Price range indicator
  - `availability` (text) - Stock status
  - `delivery_format` (text[]) - Available packaging (bulk, pallets, bags, etc.)
  - `coverage_m2_per_ton` (decimal) - Coverage area per ton
  - `environmental_certification` (text[]) - Eco certifications
  - `special_properties` (text[]) - Notable features
  - `installation_notes` (text) - Installation guidelines
  - `image_url` (text) - Primary image URL
  - `image_gallery` (text[]) - Array of additional image URLs
  - `reference_projects` (jsonb) - Project examples in JSON format
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. user_selections
  Tracks plants and stones selected by users for their projects.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `plant_id` (uuid, foreign key, nullable) - References plants table
  - `stone_id` (uuid, foreign key, nullable) - References stones table
  - `quantity` (integer) - Number of items selected
  - `notes` (text) - User notes for this selection
  - `created_at` (timestamptz) - Selection timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled to ensure data security.

  ### Plants Table Policies
  - **Public read access**: Anyone can view plants catalog
  - **Authenticated insert/update/delete**: Only authenticated admin users can modify plants

  ### Stones Table Policies
  - **Public read access**: Anyone can view stones catalog
  - **Authenticated insert/update/delete**: Only authenticated admin users can modify stones

  ### User Selections Policies
  - **User can view own selections**: Users can only see their own selections
  - **User can create own selections**: Users can add items to their selection
  - **User can update own selections**: Users can modify their selections
  - **User can delete own selections**: Users can remove items from their selection

  ## Performance

  ### Indexes
  - Plants: botanical_name, plant_type, climate_zones (GIN index for array search)
  - Stones: name, stone_type, climate_zones (GIN index for array search)
  - User selections: user_id, plant_id, stone_id for fast lookups

  ## Notes
  - All timestamps use timezone-aware timestamptz
  - Arrays and JSONB used for flexible multi-value storage
  - Foreign keys ensure referential integrity
  - Default values set for timestamps and booleans
  - Cascading deletes configured for user_selections when plants/stones are removed
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create plants table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  botanical_name text NOT NULL,
  common_name_de text,
  common_name_en text,
  plant_type text,
  climate_zones text[] DEFAULT '{}',
  height_min_cm integer,
  height_max_cm integer,
  width_min_cm integer,
  width_max_cm integer,
  sun_requirements text,
  soil_type text[] DEFAULT '{}',
  soil_moisture text,
  soil_ph text,
  growth_rate text,
  evergreen boolean DEFAULT false,
  native_region text,
  usage_categories text[] DEFAULT '{}',
  seasonal_colors jsonb DEFAULT '{}',
  flower_color text[] DEFAULT '{}',
  flower_period text,
  foliage_color text[] DEFAULT '{}',
  fall_color text,
  fruit_ornamental boolean DEFAULT false,
  fragrance boolean DEFAULT false,
  attracts_wildlife text[] DEFAULT '{}',
  deer_resistant boolean DEFAULT false,
  drought_tolerant boolean DEFAULT false,
  salt_tolerant boolean DEFAULT false,
  maintenance_level text,
  special_features text[] DEFAULT '{}',
  planting_tips text,
  care_instructions text,
  image_url text,
  image_gallery text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stones table
CREATE TABLE IF NOT EXISTS stones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  stone_type text,
  origin text,
  color_primary text,
  color_secondary text[] DEFAULT '{}',
  morphology text,
  size_min_mm integer,
  size_max_mm integer,
  surface_treatment text[] DEFAULT '{}',
  climate_zones text[] DEFAULT '{}',
  frost_resistant boolean DEFAULT false,
  slip_resistant boolean DEFAULT false,
  applications text[] DEFAULT '{}',
  indoor_use boolean DEFAULT false,
  outdoor_use boolean DEFAULT false,
  density_kg_m3 integer,
  water_absorption_percent decimal(5,2),
  compressive_strength_mpa integer,
  abrasion_resistance text,
  maintenance_requirements text,
  sealing_recommended boolean DEFAULT false,
  producer_seller text,
  price_category text,
  availability text,
  delivery_format text[] DEFAULT '{}',
  coverage_m2_per_ton decimal(8,2),
  environmental_certification text[] DEFAULT '{}',
  special_properties text[] DEFAULT '{}',
  installation_notes text,
  image_url text,
  image_gallery text[] DEFAULT '{}',
  reference_projects jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_selections table
CREATE TABLE IF NOT EXISTS user_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plant_id uuid REFERENCES plants(id) ON DELETE CASCADE,
  stone_id uuid REFERENCES stones(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT plant_or_stone_check CHECK (
    (plant_id IS NOT NULL AND stone_id IS NULL) OR
    (plant_id IS NULL AND stone_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plants_botanical_name ON plants(botanical_name);
CREATE INDEX IF NOT EXISTS idx_plants_plant_type ON plants(plant_type);
CREATE INDEX IF NOT EXISTS idx_plants_climate_zones ON plants USING GIN(climate_zones);
CREATE INDEX IF NOT EXISTS idx_plants_usage_categories ON plants USING GIN(usage_categories);

CREATE INDEX IF NOT EXISTS idx_stones_name ON stones(name);
CREATE INDEX IF NOT EXISTS idx_stones_stone_type ON stones(stone_type);
CREATE INDEX IF NOT EXISTS idx_stones_climate_zones ON stones USING GIN(climate_zones);
CREATE INDEX IF NOT EXISTS idx_stones_applications ON stones USING GIN(applications);

CREATE INDEX IF NOT EXISTS idx_user_selections_user_id ON user_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_plant_id ON user_selections(plant_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_stone_id ON user_selections(stone_id);

-- Enable Row Level Security
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_selections ENABLE ROW LEVEL SECURITY;

-- Plants policies: Public read, admin write
CREATE POLICY "Anyone can view plants"
  ON plants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert plants"
  ON plants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Authenticated users can update plants"
  ON plants
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Authenticated users can delete plants"
  ON plants
  FOR DELETE
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Stones policies: Public read, admin write
CREATE POLICY "Anyone can view stones"
  ON stones
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert stones"
  ON stones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Authenticated users can update stones"
  ON stones
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Authenticated users can delete stones"
  ON stones
  FOR DELETE
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- User selections policies: Users can only access their own selections
CREATE POLICY "Users can view own selections"
  ON user_selections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own selections"
  ON user_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own selections"
  ON user_selections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own selections"
  ON user_selections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);