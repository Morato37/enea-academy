import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function importRemaining() {
  const sql = readFileSync('/tmp/cc-agent/59498959/project/remaining_batches.sql', 'utf8');

  // Split into individual INSERT statements
  const statements = sql
    .split('\n')
    .filter(line => line.trim().startsWith('INSERT'));

  console.log(`Found ${statements.length} INSERT statements to execute`);

  let imported = 0;
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.error(`Error importing: ${error.message}`);
      } else {
        imported++;
        if (imported % 10 === 0) {
          console.log(`Imported ${imported}/${statements.length}...`);
        }
      }
    } catch (err) {
      console.error(`Failed to execute: ${err.message}`);
    }
  }

  // Verify final count
  const { data, error } = await supabase
    .from('plants_flat')
    .select('id', { count: 'exact', head: true });

  console.log(`\nTotal plants in database: ${data?.length || 'unknown'}`);
  console.log(`Successfully imported ${imported} additional plants`);
}

importRemaining().catch(console.error);
