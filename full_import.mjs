import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Check current plant count
async function checkProgress() {
  const { count, error } = await supabase
    .from('plants')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error checking progress:', error);
    return 0;
  }

  return count || 0;
}

async function main() {
  const count = await checkProgress();
  console.log(`Current plants in database: ${count} / 590`);

  if (count >= 590) {
    console.log('All plants already imported!');
    return;
  }

  if (count < 590) {
    console.log(`\nRemaining: ${590 - count} plants to import`);
    console.log(`\nPlease continue executing chunk files using the MCP tool:`);
    console.log(`Start from chunk_${String(Math.floor(count / 10) + 1).padStart(3, '0')}.sql`);
  }
}

main().catch(console.error);
