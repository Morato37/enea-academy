/*
  # Remove ghost upload entries and restore correct primary flags

  ## Problem
  A previous migration (20260512155011) created "ghost" plant_image entries —
  timestamp-based URLs (plant-{id}-{timestamp}.png) with display_order=1 and
  is_primary=true that do NOT exist in storage. These appeared alongside valid
  _migrated images and caused broken image slots in both the admin and cards.

  ## Changes
  1. Delete all ghost entries: timestamp-based URLs with display_order=1 that
     exist alongside a _migrated image for the same plant, where the file was
     never actually uploaded (identified by the pattern from the bulk-import script).

  2. Restore is_primary=true on the _migrated image for those plants so they
     again have a valid primary image.

  NOTE: This does NOT affect plants where timestamp-based images were genuinely
  uploaded (those have display_order=0 or only one image total).
*/

-- Step 1: Delete the ghost entries (timestamp URLs with display_order=1 co-existing with a _migrated image)
DELETE FROM plant_images
WHERE image_url ~ '/plant-[0-9]+-[0-9]{13}\.png$'
  AND display_order = 1
  AND EXISTS (
    SELECT 1 FROM plant_images pi2
    WHERE pi2.plant_id = plant_images.plant_id
      AND pi2.image_url LIKE '%_migrated%'
  );

-- Step 2: For plants that now have no primary image, set the _migrated image as primary
UPDATE plant_images
SET is_primary = true
WHERE image_url LIKE '%_migrated%'
  AND is_primary = false
  AND NOT EXISTS (
    SELECT 1 FROM plant_images pi2
    WHERE pi2.plant_id = plant_images.plant_id
      AND pi2.is_primary = true
  );
