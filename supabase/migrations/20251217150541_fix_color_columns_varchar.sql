/*
  # Fix Color Column Types

  1. Changes
    - Convert color columns from CHAR(7) to VARCHAR(7)
    - CHAR(7) pads with spaces which can cause issues with hex colors
    - VARCHAR(7) handles variable length strings and nulls better

  2. Security
    - No RLS changes needed
*/

-- Convert color columns from CHAR to VARCHAR
ALTER TABLE plants_flat 
  ALTER COLUMN color_jan TYPE VARCHAR(7),
  ALTER COLUMN color_feb TYPE VARCHAR(7),
  ALTER COLUMN color_mar TYPE VARCHAR(7),
  ALTER COLUMN color_apr TYPE VARCHAR(7),
  ALTER COLUMN color_may TYPE VARCHAR(7),
  ALTER COLUMN color_jun TYPE VARCHAR(7),
  ALTER COLUMN color_jul TYPE VARCHAR(7),
  ALTER COLUMN color_aug TYPE VARCHAR(7),
  ALTER COLUMN color_sep TYPE VARCHAR(7),
  ALTER COLUMN color_oct TYPE VARCHAR(7),
  ALTER COLUMN color_nov TYPE VARCHAR(7),
  ALTER COLUMN color_dec TYPE VARCHAR(7);
