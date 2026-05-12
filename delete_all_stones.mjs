import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllStones() {
  console.log('Starting deletion process...\n');

  // Step 1: Get all stone images from storage
  console.log('Step 1: Fetching stone images from database...');
  const { data: stoneImages, error: fetchError } = await supabase
    .from('stone_images')
    .select('image_url');

  if (fetchError) {
    console.error('Error fetching stone images:', fetchError);
  } else {
    console.log(`Found ${stoneImages.length} stone images in database`);

    // Extract file paths from URLs
    const filePaths = stoneImages
      .map(img => {
        const url = img.image_url;
        const match = url.match(/stone-images\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    console.log(`Extracted ${filePaths.length} file paths from storage URLs`);

    // Delete images from storage
    if (filePaths.length > 0) {
      console.log('Deleting images from storage...');
      const { data: deletedFiles, error: storageError } = await supabase
        .storage
        .from('stone-images')
        .remove(filePaths);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      } else {
        console.log(`✅ Deleted ${deletedFiles?.length || 0} files from storage`);
      }
    }
  }

  // Step 2: Get all stones to check for finish images
  console.log('\nStep 2: Fetching stones with finish images...');
  const { data: stones, error: stonesError } = await supabase
    .from('stones')
    .select('*');

  if (!stonesError && stones) {
    console.log(`Found ${stones.length} stones`);

    const finishImageUrls = [];
    const finishFields = [
      'finish_split_image_url',
      'finish_flamed_image_url',
      'finish_blasted_image_url',
      'finish_sawn_image_url',
      'finish_hammered_image_url',
      'finish_brushed_image_url',
      'finish_polished_image_url',
      'finish_honed_image_url'
    ];

    stones.forEach(stone => {
      finishFields.forEach(field => {
        if (stone[field]) {
          finishImageUrls.push(stone[field]);
        }
      });
    });

    console.log(`Found ${finishImageUrls.length} finish images`);

    // Extract paths and delete finish images
    const finishPaths = finishImageUrls
      .map(url => {
        const match = url.match(/stone-finishes\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (finishPaths.length > 0) {
      console.log('Deleting finish images from storage...');
      const { data: deletedFinishes, error: finishError } = await supabase
        .storage
        .from('stone-finishes')
        .remove(finishPaths);

      if (finishError) {
        console.error('Error deleting finish images:', finishError);
      } else {
        console.log(`✅ Deleted ${deletedFinishes?.length || 0} finish images from storage`);
      }
    }
  }

  // Step 3: Delete stone_combinations
  console.log('\nStep 3: Deleting stone combinations...');
  const { error: combinationsError, count: combinationsCount } = await supabase
    .from('stone_combinations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (combinationsError) {
    console.error('Error deleting stone combinations:', combinationsError);
  } else {
    console.log(`✅ Deleted stone combinations`);
  }

  // Step 4: Delete all stones (this will cascade delete stone_images)
  console.log('\nStep 4: Deleting all stones...');
  const { error: deleteError, count: deleteCount } = await supabase
    .from('stones')
    .delete()
    .neq('id', 0); // Delete all

  if (deleteError) {
    console.error('Error deleting stones:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Deleted all stones (stone_images deleted via CASCADE)`);

  // Verify deletion
  console.log('\nVerifying deletion...');
  const { data: remainingStones } = await supabase
    .from('stones')
    .select('id', { count: 'exact' });

  const { data: remainingImages } = await supabase
    .from('stone_images')
    .select('id', { count: 'exact' });

  const { data: remainingCombinations } = await supabase
    .from('stone_combinations')
    .select('id', { count: 'exact' });

  console.log(`\nRemaining records:`);
  console.log(`- Stones: ${remainingStones?.length || 0}`);
  console.log(`- Stone Images: ${remainingImages?.length || 0}`);
  console.log(`- Stone Combinations: ${remainingCombinations?.length || 0}`);

  console.log('\n✅ All stones and related data deleted!');
}

deleteAllStones().catch(console.error);
