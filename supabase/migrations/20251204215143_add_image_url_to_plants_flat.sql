/*
  # Add image_url column to plants_flat table

  1. Changes
    - Add `image_url` column to `plants_flat` table to store the primary image URL
    - Populate existing image URLs from plant_images table where available

  2. Notes
    - This column will store the primary/first image for each plant
    - It will be synced with the plant_images table
*/

-- Add image_url column to plants_flat table
ALTER TABLE plants_flat 
ADD COLUMN IF NOT EXISTS image_url text;

-- Populate image_url from plant_images table (get the first image with lowest display_order)
UPDATE plants_flat pf
SET image_url = pi.image_url
FROM (
  SELECT DISTINCT ON (plant_id) plant_id, image_url
  FROM plant_images
  ORDER BY plant_id, display_order
) pi
WHERE pf.id = pi.plant_id;
