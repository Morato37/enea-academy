/*
  # Add succulent category to plants_flat

  Adds a boolean `category_succulent` column to the plants_flat table,
  consistent with all other category columns.

  1. Changes
    - `plants_flat`: new column `category_succulent` (boolean, default false)
*/

ALTER TABLE plants_flat
  ADD COLUMN IF NOT EXISTS category_succulent boolean DEFAULT false;
