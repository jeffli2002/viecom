import { config } from 'dotenv';
import { resolve } from 'path';
import type { Config } from 'drizzle-kit';

// Load .env.local file before importing env
config({ path: resolve(process.cwd(), '.env.local') });

// Get DATABASE_URL directly from process.env to avoid env validation issues
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Please check your .env.local file.');
}

export default {
  schema: './src/server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  out: './drizzle',
} satisfies Config;

