import { readFileSync, writeFileSync } from 'fs';

const sqlContent = readFileSync('./import_plants_data.sql', 'utf-8');

const insertStatements = [];
let currentStatement = '';

for (const line of sqlContent.split('\n')) {
  currentStatement += line + '\n';

  if (line.trim().endsWith(');')) {
    insertStatements.push(currentStatement.trim());
    currentStatement = '';
  }
}

console.log(`Total INSERT statements: ${insertStatements.length}`);

const batchSize = 100;
const batches = [];

for (let i = 0; i < insertStatements.length; i += batchSize) {
  const batch = insertStatements.slice(i, i + batchSize);
  batches.push(batch.join('\n'));
}

console.log(`Split into ${batches.length} batches`);

batches.forEach((batch, index) => {
  const filename = `./plants_batch_${index + 1}.sql`;
  writeFileSync(filename, batch);
  console.log(`Created ${filename}`);
});

console.log('\nBatch files created successfully!');
