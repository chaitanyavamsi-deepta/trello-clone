const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Managed Postgres (Render/Railway/Neon) requires SSL; local dev does not.
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
