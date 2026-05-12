import { readFileSync } from 'fs';
import { config } from 'dotenv';
import pg from 'pg';

config();

const { Client } = pg;

async function importRest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  const sql = readFileSync('/tmp/cc-agent/59498959/project/remaining_batches.sql', 'utf8');

  try {
    await client.query(sql);

    const result = await client.query('SELECT COUNT(*) as total FROM plants_flat');
    console.log(`Total plants in database: ${result.rows[0].total}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

importRest().catch(console.error);
