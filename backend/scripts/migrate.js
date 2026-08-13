// scripts/migrate.js
// Executes db/schema.sql against DATABASE_URL. Run with: npm run db:init

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Applying schema.sql to', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
    await pool.query(schemaSql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
