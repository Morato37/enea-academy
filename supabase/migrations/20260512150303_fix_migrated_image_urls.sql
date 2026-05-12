/*
  # Fix _migrated image URLs

  During a bulk migration, image records were inserted with "_migrated" appended
  to the filename (e.g. "19_2_migrated.png") but the actual files in Supabase
  Storage retain their original names (e.g. "19_2.png"). This migration strips
  the "_migrated" suffix from all affected image_url values so they point to the
  real files that exist in storage.

  Affects 928 rows in plant_images.
*/

UPDATE plant_images
SET image_url = REPLACE(image_url, '_migrated', '')
WHERE image_url LIKE '%_migrated%';
