/*
  # Fix is_primary flags for plants with both migrated and new-upload images

  ## Problem
  Some plants have a `_migrated` image set as is_primary=true alongside a newer
  uploaded image. The migrated images were bulk-imported and some no longer exist
  in storage, causing the primary image slot to show a broken/fallback image while
  the real photo appears second.

  ## Changes
  1. For plants that have both a _migrated primary AND a non-migrated image:
     - Demote all _migrated images to is_primary=false
     - Promote the most recently uploaded (non-migrated) image to is_primary=true

  2. For the 4 plants with two is_primary=true images, keep only the non-migrated
     one as primary.
*/

-- Step 1: For plants that have a non-migrated image alongside a migrated primary,
-- demote the migrated image(s) to non-primary
UPDATE plant_images pi
SET is_primary = false
WHERE pi.image_url LIKE '%_migrated%'
  AND pi.is_primary = true
  AND EXISTS (
    SELECT 1 FROM plant_images pi2
    WHERE pi2.plant_id = pi.plant_id
      AND pi2.image_url NOT LIKE '%_migrated%'
  );

-- Step 2: For those same plants, ensure exactly one non-migrated image is primary
-- (promote the one with the lowest display_order, or any if display_order is tied)
UPDATE plant_images pi
SET is_primary = true
WHERE pi.id = (
  SELECT pi2.id
  FROM plant_images pi2
  WHERE pi2.plant_id = pi.plant_id
    AND pi2.image_url NOT LIKE '%_migrated%'
    AND pi2.is_primary = false
  ORDER BY pi2.display_order ASC, pi2.id ASC
  LIMIT 1
)
AND EXISTS (
  SELECT 1 FROM plant_images pi3
  WHERE pi3.plant_id = pi.plant_id
    AND pi3.image_url LIKE '%_migrated%'
    AND pi3.is_primary = false
)
AND NOT EXISTS (
  SELECT 1 FROM plant_images pi4
  WHERE pi4.plant_id = pi.plant_id
    AND pi4.image_url NOT LIKE '%_migrated%'
    AND pi4.is_primary = true
);
