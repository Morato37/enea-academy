/*
  # Create Postal Code Zones Table

  1. New Tables
    - `postal_code_zones`
      - `id` (uuid, primary key)
      - `postal_code` (text) - The postal code
      - `country_code` (text) - ISO country code (DE, AT, CH, IT, etc.)
      - `city_name` (text) - City or region name
      - `latitude` (numeric) - Geographic latitude
      - `longitude` (numeric) - Geographic longitude
      - `zone_code` (text) - Hardiness zone code (e.g., '8a', '9b')
      - `region_name` (text) - Broader region name
      - `confidence_score` (numeric) - Confidence level of zone assignment
      - `data_source` (text) - Source of the data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `postal_code_zones` table
    - Add policy for authenticated users to read postal code data
    
  3. Indexes
    - Add index on postal_code for fast lookups
    - Add index on country_code and postal_code combination
    - Add spatial index on coordinates for proximity searches
*/

CREATE TABLE IF NOT EXISTS postal_code_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code text NOT NULL,
  country_code text NOT NULL,
  city_name text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  zone_code text NOT NULL,
  region_name text,
  confidence_score numeric DEFAULT 0.8,
  data_source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE postal_code_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read postal code zones"
  ON postal_code_zones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert postal code zones"
  ON postal_code_zones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_postal_code_zones_postal_code 
  ON postal_code_zones(postal_code);

CREATE INDEX IF NOT EXISTS idx_postal_code_zones_country_postal 
  ON postal_code_zones(country_code, postal_code);

CREATE INDEX IF NOT EXISTS idx_postal_code_zones_zone_code 
  ON postal_code_zones(zone_code);

CREATE INDEX IF NOT EXISTS idx_postal_code_zones_coordinates 
  ON postal_code_zones(latitude, longitude);

-- Add some sample German postal codes for initial testing
INSERT INTO postal_code_zones (postal_code, country_code, city_name, latitude, longitude, zone_code, region_name, confidence_score, data_source)
VALUES 
  ('80331', 'DE', 'München', 48.1351, 11.5820, '7b', 'Bayern', 0.95, 'manual'),
  ('10115', 'DE', 'Berlin', 52.5200, 13.4050, '7b', 'Berlin', 0.95, 'manual'),
  ('20095', 'DE', 'Hamburg', 53.5511, 9.9937, '8a', 'Hamburg', 0.95, 'manual'),
  ('50667', 'DE', 'Köln', 50.9375, 6.9603, '8a', 'Nordrhein-Westfalen', 0.95, 'manual'),
  ('60311', 'DE', 'Frankfurt am Main', 50.1109, 8.6821, '7b', 'Hessen', 0.95, 'manual'),
  ('70173', 'DE', 'Stuttgart', 48.7758, 9.1829, '7b', 'Baden-Württemberg', 0.95, 'manual'),
  ('01067', 'DE', 'Dresden', 51.0504, 13.7373, '7a', 'Sachsen', 0.95, 'manual'),
  ('04103', 'DE', 'Leipzig', 51.3397, 12.3731, '7b', 'Sachsen', 0.95, 'manual'),
  ('30159', 'DE', 'Hannover', 52.3759, 9.7320, '7b', 'Niedersachsen', 0.95, 'manual'),
  ('90402', 'DE', 'Nürnberg', 49.4521, 11.0767, '7b', 'Bayern', 0.95, 'manual'),
  ('1010', 'AT', 'Wien', 48.2082, 16.3738, '7b', 'Wien', 0.95, 'manual'),
  ('5020', 'AT', 'Salzburg', 47.8095, 13.0550, '7a', 'Salzburg', 0.95, 'manual'),
  ('6020', 'AT', 'Innsbruck', 47.2692, 11.4041, '6b', 'Tirol', 0.90, 'manual'),
  ('8010', 'AT', 'Graz', 47.0707, 15.4395, '7b', 'Steiermark', 0.95, 'manual'),
  ('8001', 'CH', 'Zürich', 47.3769, 8.5417, '7b', 'Zürich', 0.95, 'manual'),
  ('1201', 'CH', 'Genève', 46.2044, 6.1432, '8a', 'Genève', 0.95, 'manual'),
  ('3001', 'CH', 'Bern', 46.9480, 7.4474, '7a', 'Bern', 0.95, 'manual'),
  ('6900', 'CH', 'Lugano', 46.0037, 8.9511, '8b', 'Ticino', 0.95, 'manual'),
  ('20121', 'IT', 'Milano', 45.4642, 9.1900, '8a', 'Lombardia', 0.95, 'manual'),
  ('00185', 'IT', 'Roma', 41.9028, 12.4964, '9a', 'Lazio', 0.95, 'manual'),
  ('50122', 'IT', 'Firenze', 43.7696, 11.2558, '8b', 'Toscana', 0.95, 'manual'),
  ('30121', 'IT', 'Venezia', 45.4408, 12.3155, '8b', 'Veneto', 0.95, 'manual'),
  ('80133', 'IT', 'Napoli', 40.8518, 14.2681, '9b', 'Campania', 0.95, 'manual')
ON CONFLICT DO NOTHING;
