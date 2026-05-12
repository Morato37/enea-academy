/*
  # Increase Storage File Size Limit

  1. Changes
    - Increase file size limit for `plant-images` bucket from 5MB to 100MB
    - Increase file size limit for `stone-images` bucket from 5MB to 100MB

  2. Notes
    - New limit: 104857600 bytes (100MB)
    - Previous limit: 5242880 bytes (5MB)
    - This allows uploading high-resolution images for better quality
*/

-- Update file size limit for plant-images bucket to 100MB
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'plant-images';

-- Update file size limit for stone-images bucket to 100MB
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'stone-images';
