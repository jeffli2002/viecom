#!/usr/bin/env node

/**
 * Grant credits to a specific user by email using raw SQL.
 * Usage:
 *   pnpm node scripts/grant-credits.mjs --email=user@example.com --amount=50
 */

import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const { Client } = pg;

function getArg(name) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : undefined;
}

async function main() {
  const email = getArg('email');
  const amountRaw = getArg('amount');
  const reason = getArg('reason') ?? 'Manual credit grant';

  if (!email) {
    console.error('❌ Missing required --email argument');
    process.exit(1);
  }

  if (!amountRaw) {
    console.error('❌ Missing required --amount argument');
    process.exit(1);
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error('❌ Amount must be a positive number');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set. Please configure your environment first.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log(`🔍 Looking up user ${email} ...`);
    const userResult = await client.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [email]);
    const userRow = userResult.rows[0];
    if (!userRow) {
      console.error(`❌ No user found with email ${email}`);
      process.exit(1);
    }

    const userId = userRow.id;
    console.log(`✅ Found user id=${userId}. Granting ${amount} credits...`);

    await client.query('BEGIN');

    const ensureAccount = await client.query(
      'SELECT id FROM user_credits WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (!ensureAccount.rows[0]) {
      await client.query(
        `INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent, frozen_balance, created_at, updated_at)
         VALUES ($1, $2, 0, 0, 0, 0, NOW(), NOW())`,
        [randomUUID(), userId]
      );
      console.log('ℹ️ Created missing credit account for user.');
    }

    const accountUpdate = await client.query(
      `UPDATE user_credits
       SET balance = balance + $2,
           total_earned = total_earned + $2,
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING balance`,
      [userId, amount]
    );

    const balanceAfter = accountUpdate.rows[0]?.balance;
    if (typeof balanceAfter !== 'number') {
      throw new Error('Failed to update credit balance');
    }

    const referenceId = `manual_grant_${Date.now()}`;
    await client.query(
      `INSERT INTO credit_transactions
        (id, user_id, type, amount, balance_after, source, description, reference_id, metadata, created_at)
        VALUES ($1, $2, 'earn', $3, $4, 'admin', $5, $6, NULL, NOW())`,
      [randomUUID(), userId, amount, balanceAfter, reason, referenceId]
    );

    await client.query('COMMIT');

    console.log('🎉 Credits granted successfully!');
    console.log('Amount:', amount);
    console.log('Reason:', reason);
    console.log('New balance:', balanceAfter);
    console.log('Reference ID:', referenceId);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to grant credits:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
