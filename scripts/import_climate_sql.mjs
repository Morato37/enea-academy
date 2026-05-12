#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const sqlFile = path.join(__dirname, '../climate_data_import.sql');

console.log('Reading SQL file...');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('Executing SQL...');
console.log('Note: This may take a few minutes for ~30k records...\n');

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error:', error);
} else {
  console.log('✓ Climate data imported successfully!');
}
