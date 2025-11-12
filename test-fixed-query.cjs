#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testFixedQuery() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🧪 Testing FIXED Top 10 query (without amount < 0 condition):\n');
    
    const top10 = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' THEN ABS(ct.amount) ELSE 0 END), 0) as total_consumed,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND (ct.description LIKE '%image%' OR ct.description LIKE '%Image%') THEN ABS(ct.amount) ELSE 0 END), 0) as image_credits,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND (ct.description LIKE '%video%' OR ct.description LIKE '%Video%') THEN ABS(ct.amount) ELSE 0 END), 0) as video_credits
      FROM "user" u
      LEFT JOIN credit_transactions ct ON u.id = ct.user_id AND ct.created_at >= $1
      GROUP BY u.id, u.email, u.name
      HAVING COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' THEN ABS(ct.amount) ELSE 0 END), 0) > 0
      ORDER BY total_consumed DESC
      LIMIT 10
    `, [today]);

    if (top10.rows.length === 0) {
      console.log('❌ Still no results!');
    } else {
      console.log(`✅ Found ${top10.rows.length} users with consumption:\n`);
      top10.rows.forEach((u, i) => {
        console.log(`${i+1}. ${u.email} (${u.name || 'No name'})`);
        console.log(`   Total: ${u.total_consumed}, Image: ${u.image_credits}, Video: ${u.video_credits}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testFixedQuery();

