/**
 * Test script for daily check-in functionality
 * Run with: pnpm tsx scripts/test-checkin.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testCheckinAPI() {
  console.log('🧪 Testing Daily Check-in API...\n');

  // Note: This test requires authentication
  // You'll need to provide a valid session cookie or use a test user
  const testUserId = process.env.TEST_USER_ID;
  
  if (!testUserId) {
    console.log('⚠️  TEST_USER_ID not set in .env.local');
    console.log('📝 To test the API:');
    console.log('   1. Start the dev server: pnpm dev');
    console.log('   2. Login to the app in your browser');
    console.log('   3. Open browser DevTools > Network tab');
    console.log('   4. Click "Check In Today" button');
    console.log('   5. Check the API request/response\n');
    console.log('📋 Manual Test Checklist:');
    console.log('   ✅ Component loads and shows current streak');
    console.log('   ✅ Shows credit balance badge');
    console.log('   ✅ Displays 7-day progress bar');
    console.log('   ✅ Shows last 7 days calendar');
    console.log('   ✅ Click "Check In Today" button');
    console.log('   ✅ Verify credits are added to balance');
    console.log('   ✅ Verify streak counter increases');
    console.log('   ✅ Verify progress bar updates');
    console.log('   ✅ Verify calendar shows today as checked');
    console.log('   ✅ Test consecutive days (check in multiple days)');
    console.log('   ✅ Test 7-day bonus (check in 7 consecutive days)');
    console.log('   ✅ Test duplicate check-in prevention');
    return;
  }

  try {
    // Test GET /api/rewards/checkin
    console.log('1️⃣ Testing GET /api/rewards/checkin...');
    const getResponse = await fetch(`${API_BASE_URL}/api/rewards/checkin`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
    });

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET checkin status:', JSON.stringify(getData, null, 2));
    } else {
      console.log('❌ GET failed:', getResponse.status, await getResponse.text());
    }

    // Test POST /api/rewards/checkin
    console.log('\n2️⃣ Testing POST /api/rewards/checkin...');
    const postResponse = await fetch(`${API_BASE_URL}/api/rewards/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST checkin result:', JSON.stringify(postData, null, 2));
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST failed:', postResponse.status, errorText);
      
      if (postResponse.status === 400 && errorText.includes('Already checked in')) {
        console.log('ℹ️  This is expected if you already checked in today');
      }
    }

    // Test GET /api/credits/balance
    console.log('\n3️⃣ Testing GET /api/credits/balance...');
    const balanceResponse = await fetch(`${API_BASE_URL}/api/credits/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log('✅ Credit balance:', JSON.stringify(balanceData, null, 2));
    } else {
      console.log('❌ Balance fetch failed:', balanceResponse.status);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testCheckinAPI();

