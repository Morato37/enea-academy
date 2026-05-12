/*
  # Add Perennial Size and Plant Characteristics

  1. New Fields
    - `perennial_size` (VARCHAR) - Size category for perennial plants
      - Options: 'short' (30-40cm), 'medium' (40-80cm), 'tall' (80-200cm)
      - Only relevant when category_perennial is true
    
    - `characteristic_evergreen` (BOOLEAN) - Indicates if plant retains foliage year-round
    - `characteristic_deciduous` (BOOLEAN) - Indicates if plant drops foliage seasonally

  2. Notes
    - Perennial size field is optional and only used for perennial plants
    - Renamed concept from "Special Properties" to "Plant Characteristics" (UI only)
    - Characteristics can be combined (e.g., semi-evergreen plants)
*/

-- Add perennial size field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'perennial_size'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN perennial_size VARCHAR(10);
  END IF;
END $$;

-- Add evergreen characteristic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_evergreen'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_evergreen BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add deciduous characteristic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'characteristic_deciduous'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN characteristic_deciduous BOOLEAN DEFAULT false;
  END IF;
END $$;