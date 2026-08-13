// src/config/db.js
// node-postgres connection pool. Exposes `query` for one-off statements and
// `getClient` for multi-statement transactions (BEGIN/COMMIT/ROLLBACK),
// mirroring the pattern used throughout the controllers.

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
