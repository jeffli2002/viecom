import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/server/db/index';
import { payment, user } from '../src/server/db/schema';

const email = process.argv[2];

if (!email) {
  console.error('Usage: pnpm tsx scripts/check-subscription.ts user@example.com');
  process.exit(1);
}

async function main() {
  const targetUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!targetUser.length) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const subscriptions = await db.select().from(payment).where(eq(payment.userId, targetUser[0].id));

  console.log(`Subscription records for ${email}:`);
  console.dir(subscriptions, { depth: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
