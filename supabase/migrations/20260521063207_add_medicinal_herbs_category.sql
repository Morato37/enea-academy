/*
  # Add medicinal_herbs category to plants_flat

  Adds the missing `category_medicinal_herbs` boolean column to plants_flat,
  which was referenced in frontend filters but never created in the database.

  1. Changes
    - `plants_flat`: new column `category_medicinal_herbs` (boolean, default false)
*/

ALTER TABLE plants_flat
  ADD COLUMN IF NOT EXISTS category_medicinal_herbs boolean DEFAULT false;
