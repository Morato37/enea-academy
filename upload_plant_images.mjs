import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadPlantImages(extractedZipPath) {
  console.log('Starting plant image upload process...\n');

  try {
    // Read all folders in the extracted zip directory
    const folders = await readdir(extractedZipPath, { withFileTypes: true });
    const plantFolders = folders.filter(dirent => dirent.isDirectory());

    console.log(`Found ${plantFolders.length} plant folders\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const folder of plantFolders) {
      const plantId = folder.name;
      const folderPath = join(extractedZipPath, plantId);

      try {
        // Read all files in this plant's folder
        const files = await readdir(folderPath, { withFileTypes: true });
        const imageFiles = files.filter(file =>
          file.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        );

        if (imageFiles.length === 0) {
          console.log(`⚠️  Plant ${plantId}: No images found`);
          continue;
        }

        console.log(`📸 Plant ${plantId}: Found ${imageFiles.length} image(s)`);

        const uploadedUrls = [];

        // First, delete existing images for this plant to avoid duplicates
        const { error: deleteError } = await supabase
          .from('plant_images')
          .delete()
          .eq('plant_id', parseInt(plantId));

        if (deleteError) {
          console.log(`   ⚠️  Could not clear existing images: ${deleteError.message}`);
        }

        // Upload each image
        for (let i = 0; i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          const imagePath = join(folderPath, imageFile.name);
          const imageBuffer = await readFile(imagePath);

          // Create a unique filename: plantId_1.jpg, plantId_2.jpg, etc.
          const fileExtension = imageFile.name.split('.').pop();
          const storageFileName = `${plantId}_${i + 1}.${fileExtension}`;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('plant-images')
            .upload(storageFileName, imageBuffer, {
              contentType: `image/${fileExtension}`,
              upsert: true
            });

          if (error) {
            console.error(`   ❌ Error uploading ${imageFile.name}:`, error.message);
            errorCount++;
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('plant-images')
            .getPublicUrl(storageFileName);

          uploadedUrls.push({ url: publicUrl, order: i });
          console.log(`   ✅ Uploaded: ${storageFileName}`);
        }

        // Insert all images into plant_images table
        if (uploadedUrls.length > 0) {
          const imageRecords = uploadedUrls.map(({ url, order }) => ({
            plant_id: parseInt(plantId),
            image_url: url,
            display_order: order
          }));

          const { error: insertError } = await supabase
            .from('plant_images')
            .insert(imageRecords);

          if (insertError) {
            console.error(`   ❌ Error inserting images into database:`, insertError.message);
            errorCount++;
          } else {
            console.log(`   ✅ Inserted ${uploadedUrls.length} image(s) into plant_images table`);
            successCount++;
          }
        }

        console.log('');

      } catch (err) {
        console.error(`❌ Error processing plant ${plantId}:`, err.message);
        errorCount++;
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully processed: ${successCount} plants`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Usage
const zipExtractPath = process.argv[2];

if (!zipExtractPath) {
  console.log('Usage: node upload_plant_images.mjs <path-to-extracted-zip-folder>');
  console.log('Example: node upload_plant_images.mjs /path/to/plant_images');
  process.exit(1);
}

uploadPlantImages(zipExtractPath);
