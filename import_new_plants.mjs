import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const content = readFileSync('/tmp/cc-agent/59498959/project/plants_part_1.sql', 'utf-8');
const lines = content.split('\n');

const newPlants = [];
const regex = /VALUES \((13[1-9]|1[4-9][0-9]|20[0-9]|21[0-4]),/;

for (const line of lines) {
  if (regex.test(line)) {
    const match = line.match(/VALUES \((.*)\);/);
    if (match) {
      newPlants.push(match[1]);
    }
  }
}

console.log(`Found ${newPlants.length} plants to import`);

const batchSize = 20;
for (let i = 0; i < newPlants.length; i += batchSize) {
  const batch = newPlants.slice(i, Math.min(i + batchSize, newPlants.length));
  const values = batch.join(',\n');

  const query = `
    INSERT INTO plants_flat (id, botanical_name, common_name_en, common_name_de, category_shrub, category_tree, category_palm, category_perennial, category_annual, category_biannual, category_grass, category_succulent, category_bulb, category_acquatic, category_nonvascular, exposure_sun, exposure_shade, exposure_halfshade, soil_sandy, soil_clay, soil_loamy, usage_solitary_garden, usage_solitary_park, usage_solitary_terrace, usage_trees_in_groups, usage_grasses, usage_ferns, usage_waterplants_pond, usage_medicinal_herbs, usage_ground_cover, usage_seasonal, usage_climbing, usage_formal_hedge, usage_wild_hedge, usage_tropical, zone_5a, zone_5b, zone_6a, zone_6b, zone_7a, zone_7b, zone_8a, zone_8b, zone_9a, zone_9b, zone_10a, zone_10b, color_jan, color_feb, color_mar, color_apr, color_may, color_jun, color_jul, color_aug, color_sep, color_oct, color_nov, color_dec, traits_change_with_location)
    VALUES ${values};
  `;

  console.log(`Importing batch ${Math.floor(i / batchSize) + 1}...`);
  const { data, error } = await supabase.rpc('exec_sql', { sql: query });

  if (error) {
    console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
  } else {
    console.log(`Batch ${Math.floor(i / batchSize) + 1} imported successfully`);
  }
}

console.log('Import complete!');
