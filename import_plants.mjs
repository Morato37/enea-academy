import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseValue(value) {
  if (value === 'NULL' || value === null || value === '') return null;

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

function parseSQLInsert(line) {
  const match = line.match(/INSERT INTO plants VALUES \((.*)\);/);
  if (!match) return null;

  const valuesStr = match[1];
  const values = [];
  let current = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      current += char;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      current += char;
      continue;
    }

    if (char === ',' && !inString) {
      values.push(parseValue(current.trim()));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

function convertToPlant(values) {
  if (!values || values.length < 60) return null;

  if (values[0] === null && values[1] === null) {
    return null;
  }

  const isTrue = (val) => val === 'x';

  const plant = {
    botanical_name: values[1],
    common_name_en: values[2],
    common_name_de: values[3],

    is_shrub: isTrue(values[4]),
    is_tree: isTrue(values[5]),
    is_perennial: isTrue(values[7]),
    is_annual: isTrue(values[8]),
    is_biannual: isTrue(values[9]),
    is_grass: isTrue(values[10]),
    is_succulent: isTrue(values[11]),
    is_bulb: isTrue(values[12]),
    is_aquatic: isTrue(values[13]),
    is_non_vascular: isTrue(values[14]),

    needs_sun: isTrue(values[15]),
    needs_shade: isTrue(values[16]),
    needs_half_shade: isTrue(values[17]),

    soil_sandy: isTrue(values[18]),
    soil_clay: isTrue(values[19]),
    soil_loamy: isTrue(values[20]),

    use_solitary_tree: isTrue(values[21]) || isTrue(values[22]) || isTrue(values[23]),
    use_trees_in_groups: isTrue(values[24]),
    use_ground_cover: isTrue(values[29]),
    use_seasonal: isTrue(values[30]),
    use_climbing: isTrue(values[31]),
    use_hedge: isTrue(values[32]),
    use_wild_hedge: isTrue(values[33]),

    zone_5a: isTrue(values[35]),
    zone_5b: isTrue(values[36]),
    zone_6a: isTrue(values[37]),
    zone_6b: isTrue(values[38]),
    zone_7a: isTrue(values[39]),
    zone_7b: isTrue(values[40]),
    zone_8a: isTrue(values[41]),
    zone_8b: isTrue(values[42]),
    zone_9a: isTrue(values[43]),
    zone_9b: isTrue(values[44]),
    zone_10a: isTrue(values[45]),
    zone_10b: isTrue(values[46]),

    color_jan: values[47],
    color_feb: values[48],
    color_mar: values[49],
    color_apr: values[50],
    color_may: values[51],
    color_jun: values[52],
    color_jul: values[53],
    color_aug: values[54],
    color_sep: values[55],
    color_oct: values[56],
    color_nov: values[57],
    color_dec: values[58],

    traits_vary_by_location: isTrue(values[59])
  };

  return plant;
}

async function importPlants() {
  console.log('Reading SQL file...');
  const sqlContent = readFileSync('./plants.sql', 'utf-8');
  const lines = sqlContent.split('\n');

  const plants = [];
  let skipped = 0;

  console.log('Parsing SQL data...');
  for (const line of lines) {
    if (!line.startsWith('INSERT INTO plants VALUES')) continue;

    const values = parseSQLInsert(line);
    if (!values) continue;

    const plant = convertToPlant(values);
    if (!plant) {
      skipped++;
      continue;
    }

    plants.push(plant);
  }

  console.log(`\nParsed ${plants.length} plants (skipped ${skipped} header/invalid rows)`);
  console.log('\nSample plant data:');
  console.log(JSON.stringify(plants[0], null, 2));

  console.log('\nImporting plants to Supabase...');

  const batchSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < plants.length; i += batchSize) {
    const batch = plants.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('plants')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error importing batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`Imported batch ${i / batchSize + 1}/${Math.ceil(plants.length / batchSize)} (${imported} plants)`);
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Successfully imported: ${imported} plants`);
  console.log(`Errors: ${errors} plants`);
}

importPlants().catch(console.error);
