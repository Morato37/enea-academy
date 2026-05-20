/*
  # Add annual category to plants_flat

  Adds a boolean `category_annual` column to the plants_flat table,
  consistent with all other category columns (tree, shrub, perennial, etc.).

  1. Changes
    - `plants_flat`: new column `category_annual` (boolean, default false)

  2. Security
    - No RLS changes needed; existing policies cover the table
*/

ALTER TABLE plants_flat
  ADD COLUMN IF NOT EXISTS category_annual boolean DEFAULT false;
