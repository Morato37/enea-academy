/*
  # Add new plant categories: Formal Hedge, Wild Hedge, Toxic Plant, Ground Cover, Culinary Plant

  1. Changes
    - Add `category_formal_hedge` boolean column to plants_flat (default false)
    - Add `category_wild_hedge` boolean column to plants_flat (default false)
    - Add `category_toxic_plant` boolean column to plants_flat (default false)
    - Add `category_ground_cover` boolean column to plants_flat (default false)
    - Add `category_culinary_plant` boolean column to plants_flat (default false)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_formal_hedge'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_formal_hedge boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_wild_hedge'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_wild_hedge boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_toxic_plant'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_toxic_plant boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_ground_cover'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_ground_cover boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants_flat' AND column_name = 'category_culinary_plant'
  ) THEN
    ALTER TABLE plants_flat ADD COLUMN category_culinary_plant boolean NOT NULL DEFAULT false;
  END IF;
END $$;
