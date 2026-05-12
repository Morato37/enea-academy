import { readFileSync } from 'fs';

// Read all batch files and output them as separate SQL statements for MCP execution
for (let i = 1; i <= 6; i++) {
  const sql = readFileSync(`plants_batch_${i}.sql`, 'utf-8');
  console.log(`\n=== BATCH ${i} ===`);
  console.log(sql);
  console.log(`\n=== END BATCH ${i} ===\n`);
}
