import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;
const connectionString = 'postgresql://postgres:ivan.2008@localhost:5432/postgres';

async function run() {
  console.log('Connecting to PostgreSQL to initialize databases...');
  const client = new Client({ connectionString });
  await client.connect();

  const dbs = [
    'fems_auth',
    'fems_customers',
    'fems_extinguishers',
    'fems_notifications',
    'fems_renewals',
    'fems_compliance'
  ];

  for (const db of dbs) {
    try {
      const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [db]);
      if (res.rowCount === 0) {
        console.log(`Creating database ${db}...`);
        await client.query(`CREATE DATABASE ${db}`);
        console.log(`✓ Database ${db} created.`);
      } else {
        console.log(`Database ${db} already exists.`);
      }
    } catch (err) {
      console.error(`Error with database ${db}:`, err.message);
    }
  }

  await client.end();
  console.log('PostgreSQL database initialization finished.');
}

run().catch((err) => {
  console.error('Failed to initialize databases:', err);
  process.exit(1);
});
