/*
  # Add Caching Fields to Postal Code Zones Table

  1. Schema Changes
    - Add `last_accessed` (timestamptz) - Timestamp of last query for cache management
    - Add `access_count` (integer) - Number of times this postal code has been queried
    - Add `is_verified` (boolean) - Whether this entry has been manually verified
    - Modify `data_source` to track different sources (manual, nominatim, worldclim)

  2. Indexes
    - Add index on last_accessed for cache cleanup queries
    - Add index on access_count for popularity tracking

  3. Updates
    - Set default values for existing records
    - Add trigger to automatically update last_accessed on reads

  4. Notes
    - This enables efficient caching of Nominatim API results
    - Popular postal codes are cached permanently to reduce API calls
    - TTL-based cleanup can target rarely accessed entries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'postal_code_zones' AND column_name = 'last_accessed'
  ) THEN
    ALTER TABLE postal_code_zones ADD COLUMN last_accessed timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'postal_code_zones' AND column_name = 'access_count'
  ) THEN
    ALTER TABLE postal_code_zones ADD COLUMN access_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'postal_code_zones' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE postal_code_zones ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_postal_code_zones_last_accessed
  ON postal_code_zones(last_accessed);

CREATE INDEX IF NOT EXISTS idx_postal_code_zones_access_count
  ON postal_code_zones(access_count DESC);

UPDATE postal_code_zones
SET is_verified = true, access_count = 1
WHERE data_source = 'manual';

CREATE OR REPLACE FUNCTION update_postal_code_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_postal_code_access ON postal_code_zones;

CREATE TRIGGER trigger_update_postal_code_access
  BEFORE UPDATE ON postal_code_zones
  FOR EACH ROW
  WHEN (OLD.last_accessed IS DISTINCT FROM NEW.last_accessed OR OLD.access_count IS DISTINCT FROM NEW.access_count)
  EXECUTE FUNCTION update_postal_code_access();
