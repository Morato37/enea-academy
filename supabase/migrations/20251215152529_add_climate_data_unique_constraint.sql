/*
  # Optimize Climate Data Points Table

  1. Changes
    - Add unique constraint on latitude/longitude for upsert operations
    - Add composite index for faster spatial queries
    - Ensure efficient lookups by coordinates

  2. Performance
    - Enables fast nearest-neighbor searches
    - Supports bulk import with upsert
    - Improves query performance for zone detection
*/

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_climate_data_coords;

-- Create composite index for spatial queries (lat, lon together)
CREATE INDEX IF NOT EXISTS idx_climate_lat_lon 
  ON climate_data_points (latitude, longitude);

-- Add unique constraint for upsert operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'climate_data_points_lat_lon_unique'
  ) THEN
    ALTER TABLE climate_data_points 
      ADD CONSTRAINT climate_data_points_lat_lon_unique 
      UNIQUE (latitude, longitude);
  END IF;
END $$;

-- Create index on data source for filtering
CREATE INDEX IF NOT EXISTS idx_climate_data_source_conf 
  ON climate_data_points (data_source, confidence_score DESC);

COMMENT ON CONSTRAINT climate_data_points_lat_lon_unique ON climate_data_points 
  IS 'Ensures one climate data point per coordinate pair, enables upsert operations';
