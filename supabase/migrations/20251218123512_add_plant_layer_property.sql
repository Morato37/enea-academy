/*
  # Add Layer Property to Plants
  
  1. Changes
    - Add `layer` column to `plants_flat` table
    - Column accepts values: 'Structural', 'Companion', 'Ground Cover', 'Free Floaters'
    - Column is optional (nullable)
  
  2. Notes
    - Layer property helps categorize plants by their role in landscape design
    - Tags will be displayed on plant cards
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plants_flat' AND column_name = 'layer'
  ) THEN
    ALTER TABLE plants_flat 
    ADD COLUMN layer TEXT CHECK (layer IN ('Structural', 'Companion', 'Ground Cover', 'Free Floaters'));
  END IF;
END $$;