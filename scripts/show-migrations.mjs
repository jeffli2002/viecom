import { Pool } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query('SELECT * FROM __drizzle_migrations ORDER BY created_at');
console.log(res.rows);
await pool.end();
