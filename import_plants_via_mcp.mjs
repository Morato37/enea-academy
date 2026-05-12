import { readFileSync, writeFileSync } from 'fs';

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

function sqlEscape(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  return `'${value.replace(/'/g, "''")}'`;
}

function convertToPlantSQL(values) {
  if (!values || values.length < 60) return null;

  if (values[0] === null && values[1] === null) {
    return null;
  }

  const isTrue = (val) => val === 'x';

  const botanical_name = sqlEscape(values[1]);
  const common_name_en = sqlEscape(values[2]);
  const common_name_de = sqlEscape(values[3]);

  const is_shrub = isTrue(values[4]);
  const is_tree = isTrue(values[5]);
  const is_perennial = isTrue(values[7]);
  const is_annual = isTrue(values[8]);
  const is_biannual = isTrue(values[9]);
  const is_grass = isTrue(values[10]);
  const is_succulent = isTrue(values[11]);
  const is_bulb = isTrue(values[12]);
  const is_aquatic = isTrue(values[13]);
  const is_non_vascular = isTrue(values[14]);

  const needs_sun = isTrue(values[15]);
  const needs_shade = isTrue(values[16]);
  const needs_half_shade = isTrue(values[17]);

  const soil_sandy = isTrue(values[18]);
  const soil_clay = isTrue(values[19]);
  const soil_loamy = isTrue(values[20]);

  const use_solitary_tree = isTrue(values[21]) || isTrue(values[22]) || isTrue(values[23]);
  const use_trees_in_groups = isTrue(values[24]);
  const use_ground_cover = isTrue(values[29]);
  const use_seasonal = isTrue(values[30]);
  const use_climbing = isTrue(values[31]);
  const use_hedge = isTrue(values[32]);
  const use_wild_hedge = isTrue(values[33]);

  const zone_5a = isTrue(values[35]);
  const zone_5b = isTrue(values[36]);
  const zone_6a = isTrue(values[37]);
  const zone_6b = isTrue(values[38]);
  const zone_7a = isTrue(values[39]);
  const zone_7b = isTrue(values[40]);
  const zone_8a = isTrue(values[41]);
  const zone_8b = isTrue(values[42]);
  const zone_9a = isTrue(values[43]);
  const zone_9b = isTrue(values[44]);
  const zone_10a = isTrue(values[45]);
  const zone_10b = isTrue(values[46]);

  const color_jan = sqlEscape(values[47]);
  const color_feb = sqlEscape(values[48]);
  const color_mar = sqlEscape(values[49]);
  const color_apr = sqlEscape(values[50]);
  const color_may = sqlEscape(values[51]);
  const color_jun = sqlEscape(values[52]);
  const color_jul = sqlEscape(values[53]);
  const color_aug = sqlEscape(values[54]);
  const color_sep = sqlEscape(values[55]);
  const color_oct = sqlEscape(values[56]);
  const color_nov = sqlEscape(values[57]);
  const color_dec = sqlEscape(values[58]);

  const traits_vary_by_location = isTrue(values[59]);

  return `INSERT INTO plants (
    botanical_name, common_name_en, common_name_de,
    is_shrub, is_tree, is_perennial, is_annual, is_biannual, is_grass, is_succulent, is_bulb, is_aquatic, is_non_vascular,
    needs_sun, needs_shade, needs_half_shade,
    soil_sandy, soil_clay, soil_loamy,
    use_solitary_tree, use_trees_in_groups, use_ground_cover, use_seasonal, use_climbing, use_hedge, use_wild_hedge,
    zone_5a, zone_5b, zone_6a, zone_6b, zone_7a, zone_7b, zone_8a, zone_8b, zone_9a, zone_9b, zone_10a, zone_10b,
    color_jan, color_feb, color_mar, color_apr, color_may, color_jun, color_jul, color_aug, color_sep, color_oct, color_nov, color_dec,
    traits_vary_by_location
  ) VALUES (
    ${botanical_name}, ${common_name_en}, ${common_name_de},
    ${is_shrub}, ${is_tree}, ${is_perennial}, ${is_annual}, ${is_biannual}, ${is_grass}, ${is_succulent}, ${is_bulb}, ${is_aquatic}, ${is_non_vascular},
    ${needs_sun}, ${needs_shade}, ${needs_half_shade},
    ${soil_sandy}, ${soil_clay}, ${soil_loamy},
    ${use_solitary_tree}, ${use_trees_in_groups}, ${use_ground_cover}, ${use_seasonal}, ${use_climbing}, ${use_hedge}, ${use_wild_hedge},
    ${zone_5a}, ${zone_5b}, ${zone_6a}, ${zone_6b}, ${zone_7a}, ${zone_7b}, ${zone_8a}, ${zone_8b}, ${zone_9a}, ${zone_9b}, ${zone_10a}, ${zone_10b},
    ${color_jan}, ${color_feb}, ${color_mar}, ${color_apr}, ${color_may}, ${color_jun}, ${color_jul}, ${color_aug}, ${color_sep}, ${color_oct}, ${color_nov}, ${color_dec},
    ${traits_vary_by_location}
  );`;
}

function generateSQL() {
  console.log('Reading SQL file...');
  const sqlContent = readFileSync('./plants.sql', 'utf-8');
  const lines = sqlContent.split('\n');

  const insertStatements = [];
  let skipped = 0;

  console.log('Parsing SQL data...');
  for (const line of lines) {
    if (!line.startsWith('INSERT INTO plants VALUES')) continue;

    const values = parseSQLInsert(line);
    if (!values) continue;

    const sql = convertToPlantSQL(values);
    if (!sql) {
      skipped++;
      continue;
    }

    insertStatements.push(sql);
  }

  console.log(`\nGenerated ${insertStatements.length} INSERT statements (skipped ${skipped} header/invalid rows)`);

  return insertStatements.join('\n');
}

const sql = generateSQL();
console.log('\nFirst 3 statements:');
console.log(sql.split('\n').slice(0, 30).join('\n'));
console.log('\n... (saving to file)');
writeFileSync('./import_plants_data.sql', sql);
console.log('\nSQL file saved as import_plants_data.sql');
