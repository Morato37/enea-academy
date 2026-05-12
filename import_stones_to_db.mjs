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
const sqlContent = readFileSync('insert_stones.sql', 'utf-8');

const valuesMatch = sqlContent.match(/VALUES\s+([\s\S]+);/);
if (!valuesMatch) {
  console.error('Could not find VALUES section in SQL file');
  process.exit(1);
}

const valuesSection = valuesMatch[1];
const rowStrings = valuesSection.split(/\),\s*\n\(/);

console.log(`Found ${rowStrings.length} stone rows`);

rowStrings[0] = rowStrings[0].replace(/^\(/, '');
rowStrings[rowStrings.length - 1] = rowStrings[rowStrings.length - 1].replace(/\);?\s*$/, '');

const columnNames = [
  'id', 'name', 'morphology', 'producer', 'origin', 'color',
  'area_mediterranean', 'area_central_europe', 'area_alpine',
  'usage_tiles', 'usage_block_steps', 'usage_paving', 'usage_walls', 'usage_pool', 'usage_chipping',
  'finishes_split', 'finishes_flamed', 'finishes_blasted', 'finishes_sawn', 'finishes_hammered', 'finishes_polished', 'finishes_honed',
  'resistance_frost', 'resistance_less_frost', 'resistance_not_frost'
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

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];

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
const stones = rowStrings.map((rowStr, idx) => {
  const values = parseRow(rowStr);
  const stone = {};
  columnNames.forEach((col, i) => {
    stone[col] = parseValue(values[i], col);
  });
  return stone;
});

console.log(`Parsed ${stones.length} stones successfully`);

async function importStones() {
  console.log(`Importing all ${stones.length} stones...`);

  const { data, error } = await supabase
    .from('stones')
    .upsert(stones, { onConflict: 'id' });

  if (error) {
    console.error('Error importing stones:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully imported all ${stones.length} stones!`);
}

importStones().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
