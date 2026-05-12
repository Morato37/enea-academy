/*
  # Add Finish-Specific Images to Stones

  1. Changes
    - Add image URL columns for each surface finish type
    - Each finish can have its own dedicated image
    - Enables QR code links to specific finish views
  
  2. New Columns
    - `finish_split_image_url` (text) - Image for split finish
    - `finish_flamed_image_url` (text) - Image for flamed finish
    - `finish_blasted_image_url` (text) - Image for blasted finish
    - `finish_sawn_image_url` (text) - Image for sawn finish
    - `finish_hammered_image_url` (text) - Image for hammered finish
    - `finish_brushed_image_url` (text) - Image for brushed finish
    - `finish_polished_image_url` (text) - Image for polished finish
    - `finish_honed_image_url` (text) - Image for honed finish
  
  3. Use Case
    - QR codes can link to `/stone/{id}?finish=polished` to show specific finish
    - Admin can upload separate images for each finish type
    - Public view displays the appropriate finish image based on URL parameter
*/

-- Add finish-specific image URL columns
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_split_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_flamed_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_blasted_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_sawn_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_hammered_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_brushed_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_polished_image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS finish_honed_image_url TEXT;