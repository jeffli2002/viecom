#!/usr/bin/env node
/**
 * Check credit transactions in local database
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkCredits() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all transactions for today
    console.log('📋 All credit transactions today:');
    console.log('='.repeat(80));
    const allTrans = await client.query(`
      SELECT 
        id, user_id, type, source, amount, description, created_at
      FROM credit_transactions
      WHERE created_at >= $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [today]);

    if (allTrans.rows.length === 0) {
      console.log('❌ No transactions found today!');
    } else {
      allTrans.rows.forEach((t, i) => {
        console.log(`${i+1}. User: ${t.user_id.substring(0, 8)}...`);
        console.log(`   Type: ${t.type}, Source: ${t.source}, Amount: ${t.amount}`);
        console.log(`   Description: ${t.description || 'NULL'}`);
        console.log(`   Time: ${t.created_at}`);
        console.log('');
      });
    }

    // Get total consumed
    console.log('\n📊 Total consumed (all types):');
    const totalAll = await client.query(`
      SELECT 
        type, source,
        SUM(ABS(amount)) as total,
        COUNT(*) as count
      FROM credit_transactions
      WHERE created_at >= $1
      GROUP BY type, source
    `, [today]);
    console.table(totalAll.rows);

    // Test Top 10 query
    console.log('\n👥 Top 10 users query test:');
    console.log('='.repeat(80));
    const top10 = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END), 0) as total_consumed,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 AND (ct.description LIKE '%image%' OR ct.description LIKE '%Image%') THEN ABS(ct.amount) ELSE 0 END), 0) as image_credits,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 AND (ct.description LIKE '%video%' OR ct.description LIKE '%Video%') THEN ABS(ct.amount) ELSE 0 END), 0) as video_credits,
        COALESCE(MAX(uc.balance) - MAX(uc.frozen_balance), 0) as remaining
      FROM "user" u
      LEFT JOIN credit_transactions ct ON u.id = ct.user_id AND ct.created_at >= $1
      LEFT JOIN user_credits uc ON u.id = uc.user_id
      GROUP BY u.id, u.email, u.name
      HAVING COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END), 0) > 0
      ORDER BY total_consumed DESC
      LIMIT 10
    `, [today]);

    if (top10.rows.length === 0) {
      console.log('❌ Top 10 query returned NO results!');
      console.log('\n🔍 Possible reasons:');
      console.log('1. No transactions match: type = spend AND source = api_call AND amount < 0');
      console.log('2. Description field does not contain "image" or "video"');
      console.log('3. Time zone issue with created_at');
    } else {
      console.log(`✅ Found ${top10.rows.length} users:\n`);
      top10.rows.forEach((u, i) => {
        console.log(`${i+1}. ${u.email} (${u.name || 'No name'})`);
        console.log(`   Total: ${u.total_consumed}, Image: ${u.image_credits}, Video: ${u.video_credits}`);
        console.log('');
      });
    }

    // Test simplified query (without HAVING)
    console.log('\n🔍 Simplified Top 10 (without HAVING clause):');
    const simpleTop10 = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END), 0) as total_consumed
      FROM "user" u
      LEFT JOIN credit_transactions ct ON u.id = ct.user_id AND ct.created_at >= $1
      GROUP BY u.id, u.email, u.name
      ORDER BY total_consumed DESC
      LIMIT 10
    `, [today]);

    console.table(simpleTop10.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCredits();

