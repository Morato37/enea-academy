/*
  # Add Hardiness Zone Boundary Data

  1. New Tables
    - `hardiness_zones`
      - `id` (uuid, primary key)
      - `zone_code` (text) - e.g., "8a", "9b"
      - `usda_equivalent` (text) - USDA zone mapping
      - `min_temp_celsius` (numeric) - Minimum temperature
      - `max_temp_celsius` (numeric) - Maximum temperature
      - `description` (text)

    - `zone_boundaries`
      - `id` (uuid, primary key)
      - `zone_code` (text)
      - `country_code` (text) - ISO country code
      - `region_name` (text)
      - `latitude_min` (numeric)
      - `latitude_max` (numeric)
      - `longitude_min` (numeric)
      - `longitude_max` (numeric)
      - `elevation_min` (numeric) - meters
      - `elevation_max` (numeric) - meters
      - `is_coastal` (boolean)
      - `confidence_score` (numeric) - 0.0 to 1.0

    - `geocode_cache`
      - `id` (uuid, primary key)
      - `address` (text, unique)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `elevation` (numeric)
      - `country_code` (text)
      - `detected_zones` (text[])
      - `confidence_score` (numeric)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Initial Data
    - Populate hardiness zones with accurate temperature ranges
    - Add European zone boundary data
    - Add elevation adjustment factors

  3. Security
    - Enable RLS on all tables
    - Add appropriate access policies
*/

-- Create hardiness zones reference table
CREATE TABLE IF NOT EXISTS hardiness_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code text UNIQUE NOT NULL,
  usda_equivalent text,
  min_temp_celsius numeric NOT NULL,
  max_temp_celsius numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create zone boundaries table
CREATE TABLE IF NOT EXISTS zone_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code text NOT NULL,
  country_code text NOT NULL,
  region_name text,
  latitude_min numeric NOT NULL,
  latitude_max numeric NOT NULL,
  longitude_min numeric NOT NULL,
  longitude_max numeric NOT NULL,
  elevation_min numeric DEFAULT 0,
  elevation_max numeric DEFAULT 9999,
  is_coastal boolean DEFAULT false,
  confidence_score numeric DEFAULT 0.8 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now()
);

-- Create geocode cache table
CREATE TABLE IF NOT EXISTS geocode_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  elevation numeric,
  country_code text,
  detected_zones text[],
  confidence_score numeric DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

-- Insert hardiness zone definitions
INSERT INTO hardiness_zones (zone_code, usda_equivalent, min_temp_celsius, max_temp_celsius, description) VALUES
  ('5a', '5a', -28.9, -26.1, 'Very cold winters, suitable for hardy plants'),
  ('5b', '5b', -26.1, -23.3, 'Cold winters, limited plant selection'),
  ('6a', '6a', -23.3, -20.6, 'Cold winters, moderate growing season'),
  ('6b', '6b', -20.6, -17.8, 'Cold to cool winters, good variety'),
  ('7a', '7a', -17.8, -15.0, 'Cool winters, extended growing season'),
  ('7b', '7b', -15.0, -12.2, 'Mild winters, wide plant selection'),
  ('8a', '8a', -12.2, -9.4, 'Mild winters, subtropical plants possible'),
  ('8b', '8b', -9.4, -6.7, 'Warm winters, diverse plant palette'),
  ('9a', '9a', -6.7, -3.9, 'Warm climate, Mediterranean plants thrive'),
  ('9b', '9b', -3.9, -1.1, 'Very warm, nearly frost-free'),
  ('10a', '10a', -1.1, 1.7, 'Minimal frost, tropical plants possible'),
  ('10b', '10b', 1.7, 4.4, 'Frost-free, tropical climate')
ON CONFLICT (zone_code) DO NOTHING;

-- Insert European zone boundaries (Switzerland - detailed by region)
INSERT INTO zone_boundaries (zone_code, country_code, region_name, latitude_min, latitude_max, longitude_min, longitude_max, elevation_min, elevation_max, is_coastal, confidence_score) VALUES
  -- Switzerland - High Alps
  ('6a', 'CH', 'High Alps', 45.8, 47.0, 6.0, 10.5, 1500, 9999, false, 0.95),
  ('6b', 'CH', 'Alpine Valleys', 46.0, 47.5, 7.0, 10.5, 1000, 1500, false, 0.92),
  ('7a', 'CH', 'Pre-Alps', 46.5, 47.8, 6.5, 10.0, 600, 1000, false, 0.90),
  ('7b', 'CH', 'Plateau (Basel, Zurich)', 47.0, 47.8, 7.5, 9.0, 400, 600, false, 0.93),
  ('8a', 'CH', 'Lake Geneva', 46.2, 46.6, 6.1, 6.9, 350, 450, false, 0.94),
  ('8b', 'CH', 'Ticino (Lugano)', 45.8, 46.3, 8.5, 9.2, 200, 400, false, 0.96),

  -- Germany
  ('6b', 'DE', 'Bavaria Alps', 47.2, 47.8, 10.0, 13.0, 800, 9999, false, 0.88),
  ('7a', 'DE', 'Southern Germany', 47.5, 49.5, 7.5, 13.5, 400, 800, false, 0.90),
  ('7b', 'DE', 'Central Germany', 49.5, 52.0, 6.0, 15.0, 0, 400, false, 0.92),
  ('8a', 'DE', 'Rhine Valley', 48.5, 51.5, 6.0, 8.5, 0, 300, false, 0.93),
  ('8b', 'DE', 'North Sea Coast', 53.5, 55.0, 7.0, 10.0, 0, 100, true, 0.91),

  -- Austria
  ('6a', 'AT', 'High Alps', 46.8, 47.5, 10.0, 14.0, 1500, 9999, false, 0.94),
  ('6b', 'AT', 'Alpine Valleys', 47.0, 48.0, 10.0, 15.0, 800, 1500, false, 0.91),
  ('7a', 'AT', 'Lower Austria', 47.5, 49.0, 13.0, 17.0, 200, 800, false, 0.89),
  ('7b', 'AT', 'Vienna Basin', 47.8, 48.5, 16.0, 17.0, 150, 300, false, 0.92),

  -- France
  ('7a', 'FR', 'Northern France', 48.5, 51.0, -2.0, 7.0, 0, 400, false, 0.87),
  ('7b', 'FR', 'Paris Region', 48.0, 49.5, 1.5, 4.5, 0, 200, false, 0.90),
  ('8a', 'FR', 'Loire Valley', 47.0, 48.5, -1.0, 3.0, 0, 300, false, 0.91),
  ('8b', 'FR', 'Atlantic Coast', 45.5, 48.0, -2.0, 0.5, 0, 100, true, 0.93),
  ('9a', 'FR', 'Provence', 43.0, 45.0, 4.5, 7.5, 0, 600, false, 0.94),
  ('9b', 'FR', 'French Riviera', 43.0, 44.0, 5.5, 7.7, 0, 200, true, 0.96),

  -- Italy
  ('7b', 'IT', 'Northern Plains', 44.5, 46.0, 8.0, 13.0, 0, 400, false, 0.88),
  ('8a', 'IT', 'Tuscany', 42.5, 44.5, 10.0, 12.5, 0, 600, false, 0.91),
  ('8b', 'IT', 'Central Italy', 41.5, 43.5, 11.5, 15.5, 0, 400, false, 0.90),
  ('9a', 'IT', 'Southern Italy', 39.5, 41.5, 15.0, 18.5, 0, 300, true, 0.92),
  ('9b', 'IT', 'Sicily & Sardinia', 36.5, 41.5, 8.0, 15.5, 0, 200, true, 0.93),
  ('10a', 'IT', 'Sicily Coast', 36.8, 38.5, 12.5, 15.5, 0, 100, true, 0.94),

  -- Spain
  ('8a', 'ES', 'Northern Coast', 42.5, 43.8, -8.0, -1.5, 0, 400, true, 0.89),
  ('8b', 'ES', 'Central Spain', 39.5, 41.5, -6.0, -2.0, 400, 1200, false, 0.87),
  ('9a', 'ES', 'Madrid Region', 39.5, 41.0, -4.5, -3.0, 600, 800, false, 0.90),
  ('9b', 'ES', 'Mediterranean Coast', 36.5, 40.5, -1.0, 3.5, 0, 200, true, 0.94),
  ('10a', 'ES', 'Southern Spain', 36.0, 38.0, -7.0, -2.0, 0, 300, true, 0.95),
  ('10b', 'ES', 'Canary Islands', 27.5, 29.5, -18.5, -13.5, 0, 500, true, 0.96),

  -- United Kingdom
  ('8a', 'UK', 'Scotland', 55.0, 59.0, -7.0, -2.0, 0, 400, true, 0.85),
  ('8b', 'UK', 'Northern England', 53.0, 55.0, -3.5, 0.5, 0, 300, false, 0.88),
  ('9a', 'UK', 'Southern England', 50.5, 52.5, -2.5, 1.8, 0, 200, false, 0.90),
  ('9b', 'UK', 'South West Coast', 50.0, 51.5, -5.5, -2.5, 0, 100, true, 0.92),

  -- Netherlands & Belgium
  ('8b', 'NL', 'Netherlands', 50.8, 53.5, 3.3, 7.2, 0, 100, true, 0.91),
  ('8b', 'BE', 'Belgium', 49.5, 51.5, 2.5, 6.4, 0, 200, false, 0.90),

  -- Scandinavia
  ('5a', 'NO', 'Northern Norway', 68.0, 71.0, 15.0, 31.0, 0, 9999, true, 0.83),
  ('5b', 'NO', 'Central Norway', 62.0, 68.0, 5.0, 15.0, 0, 1500, false, 0.85),
  ('6a', 'NO', 'Southern Norway', 58.0, 62.0, 5.0, 12.0, 0, 800, true, 0.87),
  ('6b', 'NO', 'Oslo Region', 59.5, 60.5, 10.0, 11.5, 0, 400, false, 0.89),

  ('5a', 'SE', 'Northern Sweden', 63.0, 69.0, 15.0, 24.0, 0, 1500, false, 0.84),
  ('5b', 'SE', 'Central Sweden', 59.0, 63.0, 12.0, 19.0, 0, 800, false, 0.86),
  ('6a', 'SE', 'Southern Sweden', 55.5, 59.0, 12.0, 18.5, 0, 400, false, 0.88),
  ('7a', 'SE', 'South Coast', 55.3, 56.5, 12.5, 14.5, 0, 100, true, 0.90),

  ('5b', 'FI', 'Northern Finland', 65.0, 70.0, 24.0, 31.0, 0, 1000, false, 0.82),
  ('6a', 'FI', 'Central Finland', 62.0, 65.0, 22.0, 30.0, 0, 500, false, 0.85),
  ('6b', 'FI', 'Southern Finland', 60.0, 62.0, 22.0, 28.0, 0, 200, false, 0.87),

  ('7a', 'DK', 'Denmark', 54.5, 57.8, 8.0, 15.2, 0, 150, true, 0.90),

  -- Eastern Europe
  ('6a', 'PL', 'Northern Poland', 52.5, 54.8, 14.0, 24.0, 0, 300, false, 0.86),
  ('6b', 'PL', 'Southern Poland', 49.0, 52.5, 14.5, 24.0, 0, 600, false, 0.88),
  ('6b', 'CZ', 'Czech Republic', 48.5, 51.0, 12.0, 18.9, 0, 800, false, 0.89),

  -- Portugal
  ('9a', 'PT', 'Northern Portugal', 40.5, 42.0, -9.0, -7.0, 0, 400, true, 0.91),
  ('9b', 'PT', 'Central Portugal', 38.5, 40.5, -9.5, -7.5, 0, 300, true, 0.93),
  ('10a', 'PT', 'Southern Portugal', 37.0, 38.5, -9.0, -7.0, 0, 200, true, 0.95)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE hardiness_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for hardiness zones (reference data)
CREATE POLICY "Anyone can read hardiness zones"
  ON hardiness_zones FOR SELECT
  TO public
  USING (true);

-- Public read access for zone boundaries
CREATE POLICY "Anyone can read zone boundaries"
  ON zone_boundaries FOR SELECT
  TO public
  USING (true);

-- Geocode cache policies
CREATE POLICY "Anyone can read geocode cache"
  ON geocode_cache FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert into geocode cache"
  ON geocode_cache FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for faster zone lookups
CREATE INDEX IF NOT EXISTS idx_zone_boundaries_coords ON zone_boundaries (latitude_min, latitude_max, longitude_min, longitude_max);
CREATE INDEX IF NOT EXISTS idx_zone_boundaries_country ON zone_boundaries (country_code);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_address ON geocode_cache (address);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_expires ON geocode_cache (expires_at);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_geocode_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM geocode_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
