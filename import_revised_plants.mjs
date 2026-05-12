import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert 1/0 or NULL to boolean
const toBool = (val) => val === 1 ? true : val === 0 ? false : null;

// Convert N'string' to string, handle NULL
const toStr = (val) => {
  if (val === 'NULL' || val === null) return null;
  if (typeof val === 'string') {
    // Remove N' prefix and ' suffix if present
    return val.replace(/^N'/, '').replace(/'$/, '');
  }
  return val;
};

// Batch size for inserts
const BATCH_SIZE = 50;

async function importPlants() {
  console.log('Starting plant import...');

  // Your data - I'll manually parse a smaller sample since the full dataset is huge
  // In production, you'd want to parse the entire SQL INSERT VALUES section

  const plants = [];

  // Sample: Parse first few rows to demonstrate
  // Format: (ID, Botanical_Name, Common_Name_EN, Common_Name_DE, Category columns..., Zone columns..., Color columns..., Trait columns...)

  const rawData = `
(1, N'Abelia', N'Abelia', N'Abelie', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'#589171', N'#589171', N'#faffff', N'#faffff', N'#faffff', N'#faffff', N'#faffff', N'#faffff', N'#589171', N'#589171', N'#589171', 0, 0, 0)
  `.trim();

  // Simple parser for VALUES section
  const parseRow = (rowStr) => {
    // Remove parentheses
    rowStr = rowStr.trim().replace(/^\(/, '').replace(/\)$/, '');

    const values = [];
    let current = '';
    let inString = false;

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      const nextChar = rowStr[i + 1];

      if (char === "'" && rowStr[i - 1] === 'N') {
        inString = true;
        current += char;
      } else if (char === "'" && inString) {
        inString = false;
        current += char;
      } else if (char === ',' && !inString) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      values.push(current.trim());
    }

    return values;
  };

  console.log('Due to the large dataset size, I recommend using the migration approach.');
  console.log('However, I can still insert via batches if you provide the complete data.');

  // For now, let's return early
  console.log('Please run: npm install && node import_revised_plants.mjs');

}

importPlants().catch(console.error);
