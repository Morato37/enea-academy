import { readFileSync, readdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeChunks() {
  const chunkDir = './import_chunks';
  const files = readdirSync(chunkDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} chunk files`);
  console.log('Starting from chunk 2 (chunk 1 already executed)...\n');

  let successCount = 10; // Already executed chunk 1 with 10 plants
  let errorCount = 0;
  const errors = [];

  for (let i = 1; i < files.length; i++) {
    const filename = files[i];
    const filepath = `${chunkDir}/${filename}`;

    try {
      const sql = readFileSync(filepath, 'utf-8');

      // Execute the SQL using Supabase's query builder
      // We need to parse each INSERT statement and execute individually
      const insertStatements = sql.split(/;\s*\n\s*INSERT/).map((stmt, idx) => {
        if (idx === 0) return stmt;
        return 'INSERT' + stmt;
      }).filter(stmt => stmt.trim());

      for (const insertStmt of insertStatements) {
        // Parse the INSERT to extract values
        const match = insertStmt.match(/VALUES\s*\(([\s\S]+)\)/);
        if (!match) continue;

        // This is complex, so let's just use raw SQL via RPC if available
        // For now, let's just report that we need manual execution
      }

      console.log(`✓ Would process ${filename} (${insertStatements.length} statements)`);

    } catch (error) {
      console.error(`✗ Error reading ${filename}:`, error.message);
      errorCount++;
      errors.push({ file: filename, error: error.message });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total chunks: ${files.length}`);
  console.log(`Processed: 1`);
  console.log(`Remaining: ${files.length - 1}`);
  console.log(`\nNote: Chunks 2-${files.length} need to be executed via MCP tool`);
}

executeChunks().catch(console.error);
