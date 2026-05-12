import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';

const chunkDir = './import_chunks';
const outputDir = './import_batches';

try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {
  // Directory exists
}

const files = readdirSync(chunkDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} chunk files`);

// Skip chunk 1 (already executed)
const remainingFiles = files.slice(1);
console.log(`Processing ${remainingFiles.length} remaining chunks`);

// Combine 5 chunks at a time (50 plants per batch)
const chunksPerBatch = 5;
const batches = [];

for (let i = 0; i < remainingFiles.length; i += chunksPerBatch) {
  const batchFiles = remainingFiles.slice(i, i + chunksPerBatch);
  const batchContent = batchFiles
    .map(f => readFileSync(`${chunkDir}/${f}`, 'utf-8'))
    .join('\n\n');

  const batchNum = Math.floor(i / chunksPerBatch) + 2; // Start from 2 since batch 1 is chunk 1
  const outputFile = `${outputDir}/batch_${String(batchNum).padStart(2, '0')}.sql`;

  writeFileSync(outputFile, batchContent);
  batches.push({
    batch: batchNum,
    file: outputFile,
    chunks: batchFiles.length,
    plants: batchFiles.length * 10
  });

  console.log(`Created ${outputFile} (${batchFiles.length} chunks, ~${batchFiles.length * 10} plants)`);
}

console.log(`\nCreated ${batches.length} batch files`);
console.log(`Total plants in batches: ~${batches.reduce((sum, b) => sum + b.plants, 0)}`);
console.log(`Plus 10 from batch 1 = ~${batches.reduce((sum, b) => sum + b.plants, 0) + 10} total plants`);
