/**
 * Disable all users whose email contains a specific substring.
 * Usage: pnpm tsx scripts/disable-users-by-pattern.ts <substring> [reason]
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

import { user } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const SUBSTRING = process.argv[2];
const reasonArg = process.argv[3];

if (!SUBSTRING) {
  console.error('❌ Substring to match is required.');
  console.error('Usage: pnpm tsx scripts/disable-users-by-pattern.ts <substring> [reason]');
  process.exit(1);
}

const banReason = reasonArg || `Duplicate account group (${SUBSTRING}) - disabled`;

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function disableUsersBySubstring() {
  const pattern = `%${SUBSTRING}%`;

  console.log(`\nSearching for users with email LIKE "${pattern}"...\n`);

  const matches = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      banned: user.banned,
      banReason: user.banReason,
    })
    .from(user)
    .where(like(user.email, pattern));

  if (matches.length === 0) {
    console.log('No matching users found.');
    return;
  }

  console.log(`Found ${matches.length} users:`);
  for (const match of matches) {
    console.log(
      ` - ${match.email} (ID: ${match.id}) | Banned: ${match.banned ? 'Yes' : 'No'} | Reason: ${match.banReason || 'N/A'}`
    );
  }

  let disabledCount = 0;
  for (const match of matches) {
    if (match.banned) {
      console.log(`Skipping ${match.email} (already banned)`);
      continue;
    }

    await db
      .update(user)
      .set({
        banned: true,
        banReason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, match.id));

    console.log(`✅ Disabled ${match.email}`);
    disabledCount++;
  }

  console.log(`\nCompleted. Disabled ${disabledCount} new accounts.`);
}

disableUsersBySubstring()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to disable users by substring:', error);
    process.exit(1);
  });
