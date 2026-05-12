/*
  # Add Climate Data and Microclimate Calculation System

  ## Summary
  This migration adds support for high-resolution climate data points and
  microclimate adjustment factors to improve hardiness zone detection accuracy.

  ## New Tables

  ### 1. climate_data_points
  Stores high-resolution temperature data from sources like WorldClim
  - latitude/longitude coordinates
  - minimum temperature (used to calculate zones)
  - calculated hardiness zone
  - data source (worldclim, weather_station, etc.)
  - confidence score

  ### 2. microclimate_factors
  Stores known microclimate effects for specific areas
  - urban heat island effects (cities warmer than surroundings)
  - coastal moderation (warmer winters near water)
  - valley cold air pooling (colder than surroundings)
  - wind exposure effects

  ### 3. zone_adjustments (Admin Override)
  Allows manual zone corrections and notes
  - admin-verified zones for specific locations
  - override automatic detection
  - notes explaining why adjustment was made

  ## Microclimate Factor Examples
  - Milano city center: +0.5 zones (urban heat island)
  - Ligurian coast: +1.0 zones (Mediterranean coastal effect)
  - Alpine valleys: -0.5 zones (cold air pooling)

  ## Data Sources
  - WorldClim: Global climate data at 1km resolution
  - Manual entries: Admin-verified climate data
  - Calculated: Based on geographic factors
*/

CREATE TABLE IF NOT EXISTS climate_data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  min_temperature numeric NOT NULL,
  hardiness_zone text NOT NULL,
  data_source text DEFAULT 'manual',
  confidence_score numeric DEFAULT 0.85,
  elevation integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_climate_data_coords ON climate_data_points (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_climate_data_zone ON climate_data_points (hardiness_zone);
CREATE INDEX IF NOT EXISTS idx_climate_data_source ON climate_data_points (data_source);

CREATE TABLE IF NOT EXISTS microclimate_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  latitude_min numeric NOT NULL,
  latitude_max numeric NOT NULL,
  longitude_min numeric NOT NULL,
  longitude_max numeric NOT NULL,
  factor_type text NOT NULL,
  zone_adjustment numeric NOT NULL,
  description text,
  confidence_score numeric DEFAULT 0.80,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_factor_type CHECK (factor_type IN ('urban_heat_island', 'coastal_moderation', 'valley_pooling', 'wind_exposure', 'elevation', 'lake_effect', 'custom'))
);

CREATE INDEX IF NOT EXISTS idx_microclimate_coords ON microclimate_factors (latitude_min, latitude_max, longitude_min, longitude_max);
CREATE INDEX IF NOT EXISTS idx_microclimate_type ON microclimate_factors (factor_type);
CREATE INDEX IF NOT EXISTS idx_microclimate_active ON microclimate_factors (is_active);

CREATE TABLE IF NOT EXISTS zone_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_identifier text UNIQUE NOT NULL,
  latitude numeric,
  longitude numeric,
  original_zone text,
  adjusted_zone text NOT NULL,
  adjustment_reason text NOT NULL,
  data_source text DEFAULT 'admin_verified',
  verified_by text,
  confidence_score numeric DEFAULT 0.99,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zone_adjustments_location ON zone_adjustments (LOWER(location_identifier));
CREATE INDEX IF NOT EXISTS idx_zone_adjustments_coords ON zone_adjustments (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_zone_adjustments_active ON zone_adjustments (is_active);

INSERT INTO microclimate_factors (
  location_name, latitude_min, latitude_max, longitude_min, longitude_max,
  factor_type, zone_adjustment, description, confidence_score
) VALUES
  ('Milano Urban Area', 45.40, 45.52, 9.10, 9.28, 'urban_heat_island', 0.5, 'City center urban heat island effect - winters 1-2°C warmer', 0.90),
  ('Roma Urban Area', 41.80, 41.98, 12.40, 12.58, 'urban_heat_island', 0.5, 'Rome city center heat island', 0.88),
  ('Paris Urban Area', 48.80, 48.92, 2.25, 2.45, 'urban_heat_island', 0.5, 'Paris metropolitan heat island', 0.88),
  ('Berlin Urban Area', 52.45, 52.58, 13.30, 13.50, 'urban_heat_island', 0.3, 'Berlin city center moderate heat island', 0.85),
  ('London Urban Area', 51.45, 51.58, -0.20, 0.05, 'urban_heat_island', 0.5, 'London urban heat island effect', 0.88),
  
  ('Ligurian Coast', 43.70, 44.50, 7.50, 10.00, 'coastal_moderation', 1.0, 'Mediterranean coastal moderation - very mild winters', 0.92),
  ('French Riviera', 43.50, 43.80, 6.90, 7.50, 'coastal_moderation', 1.0, 'Protected Mediterranean coast', 0.93),
  ('Tuscan Coast', 42.80, 43.50, 10.20, 10.60, 'coastal_moderation', 0.7, 'Tyrrhenian Sea coastal effect', 0.88),
  ('Adriatic Coast North', 44.80, 45.80, 12.30, 13.80, 'coastal_moderation', 0.5, 'Northern Adriatic moderate effect', 0.85),
  ('Southern Italy Coast', 39.50, 41.50, 15.00, 18.50, 'coastal_moderation', 0.8, 'Mediterranean coastal influence', 0.90),
  ('Sicily Coast', 36.80, 38.50, 12.50, 15.50, 'coastal_moderation', 0.8, 'Sicilian coastal moderation', 0.91),
  
  ('Po Valley Cold Pockets', 44.90, 45.30, 10.50, 12.00, 'valley_pooling', -0.3, 'Cold air drainage in valley bottoms', 0.80),
  ('Alpine Valley Floors', 45.80, 46.50, 7.50, 12.00, 'valley_pooling', -0.5, 'Cold air pooling in mountain valleys', 0.85),
  
  ('Lake Garda', 45.50, 45.80, 10.50, 10.90, 'lake_effect', 0.5, 'Lake Garda microclimate - moderating effect', 0.87),
  ('Lake Como', 45.90, 46.15, 9.15, 9.40, 'lake_effect', 0.4, 'Lake Como moderating influence', 0.86),
  ('Lake Maggiore', 45.70, 46.15, 8.45, 8.75, 'lake_effect', 0.4, 'Lake Maggiore temperature moderation', 0.86)
ON CONFLICT DO NOTHING;

INSERT INTO zone_adjustments (
  location_identifier, latitude, longitude, 
  original_zone, adjusted_zone, adjustment_reason, 
  verified_by, confidence_score
) VALUES
  ('Milano, Italy', 45.4642, 9.1900, '8b', '9a', 'Jelitto verified - Po Valley humid subtropical climate with mild winters', 'Jelitto Standards', 0.99),
  ('Roma, Italy', 41.9028, 12.4964, '9a', '9a', 'Jelitto verified - Mediterranean climate confirmed', 'Jelitto Standards', 0.99),
  ('Firenze, Italy', 43.7696, 11.2558, '8b', '9a', 'Jelitto verified - Tuscan valley with mild winters', 'Jelitto Standards', 0.99),
  ('Genova, Italy', 44.4056, 8.9463, '9a', '9b', 'Jelitto verified - Protected Ligurian coast, very mild', 'Jelitto Standards', 0.99),
  ('Palermo, Sicily', 38.1157, 13.3615, '9b', '10a', 'Jelitto verified - Sicilian climate, extremely mild winters', 'Jelitto Standards', 0.99)
ON CONFLICT (location_identifier) DO UPDATE SET
  adjusted_zone = EXCLUDED.adjusted_zone,
  adjustment_reason = EXCLUDED.adjustment_reason,
  verified_by = EXCLUDED.verified_by,
  updated_at = now();

ALTER TABLE climate_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE microclimate_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read climate data"
  ON climate_data_points FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read microclimate factors"
  ON microclimate_factors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read zone adjustments"
  ON zone_adjustments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert climate data"
  ON climate_data_points FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update climate data"
  ON climate_data_points FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage microclimate factors"
  ON microclimate_factors FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage zone adjustments"
  ON zone_adjustments FOR ALL
  TO authenticated
  USING (true);

COMMENT ON TABLE climate_data_points IS 'High-resolution temperature data from WorldClim and other sources';
COMMENT ON TABLE microclimate_factors IS 'Geographic factors that adjust hardiness zones (urban heat, coastal, valleys, etc.)';
COMMENT ON TABLE zone_adjustments IS 'Admin-verified zone overrides for specific locations';
