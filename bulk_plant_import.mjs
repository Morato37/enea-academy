import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

console.log('Reading SQL file...');
const sqlContent = readFileSync('insert_plants.sql', 'utf-8');

// Extract all VALUES rows
const valuesMatch = sqlContent.match(/VALUES\s+([\s\S]+);/);
if (!valuesMatch) {
  console.error('Could not parse VALUES section');
  process.exit(1);
}

const valuesSection = valuesMatch[1];

// Split by "),\n(" to get individual rows
const rowStrings = valuesSection.split(/\),\s*\n\(/);

console.log(`Found ${rowStrings.length} plant rows`);

// Clean up first and last rows
rowStrings[0] = rowStrings[0].replace(/^\(/, '');
rowStrings[rowStrings.length - 1] = rowStrings[rowStrings.length - 1].replace(/\);?\s*$/, '');

const columnNames = [
  'id', 'botanical_name', 'common_name_en', 'common_name_de',
  'is_shrub', 'is_tree', 'is_perennial', 'is_annual', 'is_grass', 'is_succulent', 'is_bulb', 'is_aquatic', 'is_non_vascular',
  'needs_sun', 'needs_shade', 'needs_half_shade',
  'soil_sandy', 'soil_clay', 'soil_loamy',
  'use_solitary_tree', 'use_trees_in_groups', 'use_ground_cover', 'use_seasonal', 'use_climbing', 'use_hedge', 'use_wild_hedge',
  'zone_5a', 'zone_5b', 'zone_6a', 'zone_6b', 'zone_7a', 'zone_7b', 'zone_8a', 'zone_8b', 'zone_9a', 'zone_9b', 'zone_10a', 'zone_10b',
  'color_jan', 'color_feb', 'color_mar', 'color_may', 'color_jun', 'color_jul', 'color_aug', 'color_sep', 'color_oct', 'color_nov', 'color_dec',
  'traits_vary_by_location', 'traits_vary_annual_perennial', 'has_different_bloom_colors'
];

function parseValue(v, columnName) {
  v = v.trim();
  if (v === 'NULL') return null;

  if (v.startsWith("N'") && v.endsWith("'")) {
    return v.substring(2, v.length - 1).replace(/''/g, "'");
  }
  if (v.startsWith("'") && v.endsWith("'")) {
    return v.substring(1, v.length - 1).replace(/''/g, "'");
  }

  const num = Number(v);
  if (!isNaN(num)) {
    if (columnName === 'id') {
      return num;
    }
    if (num === 1) return true;
    if (num === 0) return false;
    return num;
  }

  return v;
}

function parseRow(rowStr) {
  const values = [];
  let current = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === "'") {
      if (i + 1 < rowStr.length && rowStr[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString && char === ',') {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) {
    values.push(current);
  }

  return values;
}

console.log('Parsing rows...');
const plants = rowStrings.map((rowStr, idx) => {
  const values = parseRow(rowStr);
  const plant = {};
  columnNames.forEach((col, i) => {
    plant[col] = parseValue(values[i], col);
  });
  return plant;
});

console.log(`Parsed ${plants.length} plants successfully`);

// Import in batches
async function importInBatches() {
  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < plants.length; i += batchSize) {
    const batch = plants.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(plants.length / batchSize);
    
    console.log(`Importing batch ${batchNum}/${totalBatches} (rows ${i + 1}-${Math.min(i + batchSize, plants.length)})...`);

    const { error } = await supabase
      .from('plants')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error in batch ${batchNum}:`, error);
      throw error;
    }

    imported += batch.length;
    console.log(`✓ Progress: ${imported}/${plants.length} plants imported`);
  }

  console.log(`\n✅ Successfully imported all ${plants.length} plants!`);
}

importInBatches().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
