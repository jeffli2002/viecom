import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL missing in environment');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  const email = process.argv[2] || 'jefflee2002@gmail.com';

  const [user] = await sql`
    SELECT id, email FROM "user"
    WHERE email = ${email}
    LIMIT 1
  `;

  if (!user) {
    console.error('User not found:', email);
    return;
  }

  console.log('User:', user);

  const credits = await sql`
    SELECT balance, total_earned, total_spent, updated_at
    FROM user_credits
    WHERE user_id = ${user.id}
  `;
  console.log('Credits:', credits);

  const transactions = await sql`
    SELECT id, type, amount, balance_after, source, description, reference_id, metadata, created_at
    FROM credit_transactions
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('Recent credit transactions:', transactions);

  const subscriptions = await sql`
    SELECT id, user_id, subscription_id, price_id, product_id, status, interval, cancel_at_period_end, period_start, period_end, created_at, updated_at
    FROM payment
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Recent subscription records:', subscriptions);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
