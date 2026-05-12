/*
  # Backup Climate Data Points Table
  
  1. Purpose
    - Creates a backup of existing climate_data_points table before WorldClim integration
    - Preserves the simplified latitude-based model data as fallback
  
  2. Changes
    - Create climate_data_points_backup table with identical schema
    - Copy all existing data to backup table
  
  3. Notes
    - This backup can be restored if needed
    - Original simplified model preserved for reference
*/

-- Create backup table with same schema as climate_data_points
CREATE TABLE IF NOT EXISTS climate_data_points_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  min_temperature numeric NOT NULL,
  hardiness_zone text NOT NULL,
  elevation integer,
  notes text,
  data_source text DEFAULT 'manual',
  confidence_score numeric DEFAULT 0.85,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy all existing data to backup
INSERT INTO climate_data_points_backup (
  id, latitude, longitude, min_temperature, hardiness_zone, 
  elevation, notes, data_source, confidence_score, created_at, updated_at
)
SELECT 
  id, latitude, longitude, min_temperature, hardiness_zone,
  elevation, notes, data_source, confidence_score, created_at, updated_at
FROM climate_data_points
ON CONFLICT DO NOTHING;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_climate_backup_coords 
  ON climate_data_points_backup(latitude, longitude);

-- Add comment
COMMENT ON TABLE climate_data_points_backup IS 'Backup of climate data points before WorldClim integration (2024-12-16)';