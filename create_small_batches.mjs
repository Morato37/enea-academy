import { readFileSync, writeFileSync, mkdirSync } from 'fs';

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

// Create very small batches of 10 statements each
const batchSize = 10;

try {
  mkdirSync('./import_chunks', { recursive: true });
} catch (e) {
  // Directory already exists
}

const chunks = [];

for (let i = 0; i < insertStatements.length; i += batchSize) {
  const batch = insertStatements.slice(i, i + batchSize);
  const filename = `./import_chunks/chunk_${String(i / batchSize + 1).padStart(3, '0')}.sql`;
  writeFileSync(filename, batch.join('\n\n'));
  chunks.push({
    index: i / batchSize + 1,
    filename,
    count: batch.length
  });
}

console.log(`Created ${chunks.length} chunk files with ${batchSize} statements each`);

// Save metadata
writeFileSync('./import_chunks.json', JSON.stringify(chunks, null, 2));
console.log('Chunk metadata saved to import_chunks.json');
