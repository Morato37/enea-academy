import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample of first 20 plants from the PDF - you can extend this
const plants = [
  { id: 1, botanical_name: 'Abelia', common_name_en: 'Abelia', common_name_de: 'Abelie', is_shrub: true, needs_half_shade: true, soil_sandy: true, soil_loamy: true, use_seasonal: true, use_hedge: true, zone_5a: true, zone_5b: true, zone_6a: true, zone_6b: true, color_jan: '#589171', color_feb: '#589171', color_mar: '#faffff', color_apr: '#faffff', color_may: '#faffff', color_jun: '#faffff', color_jul: '#faffff', color_aug: '#faffff', color_sep: '#faffff', color_oct: '#589171', color_nov: '#589171', color_dec: '#589171' },
  { id: 2, botanical_name: 'Abies alba', common_name_en: 'European silver fir', common_name_de: 'Europäische Silber-Tanne', is_tree: true, needs_sun: true, soil_sandy: true, soil_clay: true, soil_loamy: true, use_trees_in_groups: true, zone_5b: true, zone_6a: true, zone_6b: true, zone_7a: true, color_jan: '#426926', color_feb: '#426926', color_mar: '#426926', color_apr: '#426926', color_may: '#426926', color_jun: '#426926', color_jul: '#426926', color_aug: '#426926', color_sep: '#426926', color_oct: '#426926', color_nov: '#426926', color_dec: '#426926' },
  { id: 3, botanical_name: 'Acaena', common_name_en: 'New Zealand burr', common_name_de: 'Neuseeland-Burdock', is_tree: true, needs_sun: true, needs_half_shade: true, soil_sandy: true, soil_loamy: true, use_ground_cover: true, zone_5a: true, zone_5b: true, zone_6a: true, zone_6b: true, color_jan: '#8bd57d', color_feb: '#8bd57d', color_mar: '#8bd57d', color_apr: '#8bd57d', color_may: '#8bd57d', color_jun: '#e1517b', color_jul: '#e1517b', color_aug: '#e1517b', color_sep: '#8bd57d', color_oct: '#8bd57d', color_nov: '#8bd57d', color_dec: '#8bd57d' }
];

console.log(`Importing ${plants.length} plants...`);

// Import in batches of 50
const batchSize = 50;
let imported = 0;

for (let i = 0; i < plants.length; i += batchSize) {
  const batch = plants.slice(i, i + batchSize);

  const { data, error } = await supabase
    .from('plants')
    .insert(batch);

  if (error) {
    console.error(`Error importing batch ${i / batchSize + 1}:`, error);
  } else {
    imported += batch.length;
    console.log(`Imported ${imported}/${plants.length} plants`);
  }
}

console.log(`Successfully imported ${imported} plants!`);
