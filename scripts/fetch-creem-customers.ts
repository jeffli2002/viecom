/**
 * Try to fetch customer data from Creem API
 * This might give us the subscriptions through a different route
 */

import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const CREEM_API_KEY = process.env.CREEM_API_KEY!;

async function tryEndpoint(endpoint: string, name: string) {
  console.log(`\n🔍 Trying ${name}: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success!`);
      console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 500));
      return data;
    } else {
      const text = await response.text();
      console.log(`   ❌ Error: ${text.substring(0, 200)}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Failed:`, error);
    return null;
  }
}

async function main() {
  console.log('🔍 Exploring Creem API endpoints...\n');

  const baseUrl = 'https://api.creem.io/v1';

  // Try different endpoints
  await tryEndpoint(`${baseUrl}/subscriptions`, 'List Subscriptions');
  await tryEndpoint(`${baseUrl}/customers`, 'List Customers');
  await tryEndpoint(`${baseUrl}/products`, 'List Products');
  await tryEndpoint(`${baseUrl}/checkouts`, 'List Checkouts');

  console.log('\n\n💡 If any endpoint worked, we can use it to get subscription data!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
