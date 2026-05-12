/*
  # Revert _migrated URL fix

  The previous migration (fix_migrated_image_urls) incorrectly assumed that
  removing "_migrated" from filenames would restore working URLs. In reality,
  neither the _migrated versions nor the stripped versions exist in storage —
  the files were simply never uploaded. This reverts all changed URLs back to
  their original _migrated form to restore the previous state.
*/

UPDATE plant_images
SET image_url = REGEXP_REPLACE(image_url, '(\.[a-z]+)$', '_migrated\1')
WHERE image_url ~ '^https://xbzufokfcflpweudtoen\.supabase\.co/storage/v1/object/public/plant-images/'
  AND (
    -- Simple numeric pattern: 19_2.png, 1_1.png etc (was _migrated, no original existed)
    image_url ~ '/[0-9]+_[0-9]+\.(png|jpg|webp)$'
    -- Timestamp-based with plant- prefix that had _migrated
    OR image_url ~ '/plant-[0-9]+-[0-9]+\.(png|jpg|webp)$'
  );
