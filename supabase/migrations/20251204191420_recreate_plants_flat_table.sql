/*
  # Recreate Plants Table with Flat Structure

  1. Changes
    - Drop existing plants table
    - Create new plants_flat table with flat boolean structure
    - Structure includes categories, exposure, soil, usage, zones, and monthly colors
  
  2. New Structure
    - Flat boolean fields for all multi-value attributes
    - Monthly color fields (CHAR(7) for hex colors)
    - traits_change_with_location for location-dependent traits
*/

-- Drop existing plants table
DROP TABLE IF EXISTS plants CASCADE;

-- Create new plants_flat table
CREATE TABLE IF NOT EXISTS plants_flat (
    id                  INT PRIMARY KEY,
    botanical_name      VARCHAR(255) NOT NULL,
    common_name_en      VARCHAR(255),
    common_name_de      VARCHAR(255),

    -- CATEGORY (Shrub → Non-vascular)
    category_shrub          BOOLEAN,
    category_tree           BOOLEAN,
    category_palm           BOOLEAN,
    category_perennial      BOOLEAN,
    category_annual         BOOLEAN,
    category_biannual       BOOLEAN,
    category_grass          BOOLEAN,
    category_succulent      BOOLEAN,
    category_bulb           BOOLEAN,
    category_acquatic       BOOLEAN,
    category_nonvascular    BOOLEAN,

    -- EXPOSURE (Sun → Half Shade)
    exposure_sun        BOOLEAN,
    exposure_shade      BOOLEAN,
    exposure_halfshade  BOOLEAN,

    -- SOIL (Sandy → Loamy)
    soil_sandy          BOOLEAN,
    soil_clay           BOOLEAN,
    soil_loamy          BOOLEAN,

    -- USAGE (Solitary Garden → Tropical)
    usage_solitary_garden      BOOLEAN,
    usage_solitary_park        BOOLEAN,
    usage_solitary_terrace     BOOLEAN,
    usage_trees_in_groups      BOOLEAN,
    usage_grasses              BOOLEAN,
    usage_ferns                BOOLEAN,
    usage_waterplants_pond     BOOLEAN,
    usage_medicinal_herbs      BOOLEAN,
    usage_ground_cover         BOOLEAN,
    usage_seasonal             BOOLEAN,
    usage_climbing             BOOLEAN,
    usage_formal_hedge         BOOLEAN,
    usage_wild_hedge           BOOLEAN,
    usage_tropical             BOOLEAN,

    -- ZONES (5a → 10b)
    zone_5a        BOOLEAN,
    zone_5b        BOOLEAN,
    zone_6a        BOOLEAN,
    zone_6b        BOOLEAN,
    zone_7a        BOOLEAN,
    zone_7b        BOOLEAN,
    zone_8a        BOOLEAN,
    zone_8b        BOOLEAN,
    zone_9a        BOOLEAN,
    zone_9b        BOOLEAN,
    zone_10a       BOOLEAN,
    zone_10b       BOOLEAN,

    -- COLORS PER MONTH (Jan → Dec)
    color_jan       CHAR(7),
    color_feb       CHAR(7),
    color_mar       CHAR(7),
    color_apr       CHAR(7),
    color_may       CHAR(7),
    color_jun       CHAR(7),
    color_jul       CHAR(7),
    color_aug       CHAR(7),
    color_sep       CHAR(7),
    color_oct       CHAR(7),
    color_nov       CHAR(7),
    color_dec       CHAR(7),

    traits_change_with_location TEXT
);

-- Enable RLS
ALTER TABLE plants_flat ENABLE ROW LEVEL SECURITY;

-- Create policies for plants_flat
CREATE POLICY "Anyone can read plants_flat"
  ON plants_flat
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert plants_flat"
  ON plants_flat
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update plants_flat"
  ON plants_flat
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete plants_flat"
  ON plants_flat
  FOR DELETE
  TO authenticated
  USING (true);
