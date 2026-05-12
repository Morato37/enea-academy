import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupStones() {
  console.log('Starting stones backup...');

  // Backup stones
  console.log('Fetching stones...');
  const { data: stones, error: stonesError } = await supabase
    .from('stones')
    .select('*')
    .order('id');

  if (stonesError) {
    console.error('Error fetching stones:', stonesError);
    process.exit(1);
  }

  console.log(`Found ${stones.length} stones`);

  // Backup stone_images
  console.log('Fetching stone images...');
  const { data: stoneImages, error: imagesError } = await supabase
    .from('stone_images')
    .select('*')
    .order('stone_id, display_order');

  if (imagesError) {
    console.error('Error fetching stone images:', imagesError);
    process.exit(1);
  }

  console.log(`Found ${stoneImages.length} stone images`);

  // Backup stone_combinations
  console.log('Fetching stone combinations...');
  const { data: combinations, error: combinationsError } = await supabase
    .from('stone_combinations')
    .select('*')
    .order('tile_stone_id, cobblestone_stone_id');

  if (combinationsError) {
    console.error('Error fetching stone combinations:', combinationsError);
    process.exit(1);
  }

  console.log(`Found ${combinations.length} stone combinations`);

  // Create backup object
  const backup = {
    backup_date: new Date().toISOString(),
    stones,
    stone_images: stoneImages,
    stone_combinations: combinations
  };

  // Save to file
  const filename = `stones_backup_${new Date().toISOString().split('T')[0]}.json`;
  writeFileSync(filename, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup created: ${filename}`);
  console.log(`- Stones: ${stones.length}`);
  console.log(`- Stone Images: ${stoneImages.length}`);
  console.log(`- Stone Combinations: ${combinations.length}`);
}

backupStones().catch(console.error);
