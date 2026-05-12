/*
  # Fix wrongly added _migrated suffix

  The previous revert migration incorrectly added "_migrated" to URLs that were
  never _migrated in the first place (e.g. plant-19-1776344760265.png became
  plant-19-1776344760265_migrated.png). This migration removes the _migrated
  suffix ONLY from URLs that were genuine original files — identified by having
  a timestamp-style name (plant-{id}-{timestamp}.png or plants/{id}_{timestamp}_*.ext)
  which were never _migrated.
  
  These are safe to strip because the real files in storage use those exact names.
*/

-- Remove _migrated from URLs that have timestamp-based names (these were genuine originals, wrongly touched by the revert)
UPDATE plant_images
SET image_url = REPLACE(image_url, '_migrated', '')
WHERE image_url LIKE '%_migrated%'
  AND (
    -- plant-{id}-{13digit_timestamp}.png pattern
    image_url ~ '/plant-[0-9]+-[0-9]{13}_migrated\.(png|jpg|webp|jpeg)$'
    -- plants/{id}_{timestamp}_{n}.ext pattern  
    OR image_url ~ '/plants/[0-9]+_[0-9]+_[0-9]+_migrated\.(png|jpg|webp|jpeg)$'
  );
