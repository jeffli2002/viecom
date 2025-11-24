/**
 * Browser Console Script - Extract Creem Subscription Data
 *
 * HOW TO USE:
 * 1. Open Creem dashboard in your browser
 * 2. Go to the Subscriptions page (where you see the 14 active subscriptions)
 * 3. Press F12 to open Developer Tools
 * 4. Click on "Console" tab
 * 5. Copy and paste this ENTIRE script into the console
 * 6. Press Enter
 * 7. It will download a CSV file automatically!
 */

(() => {
  console.log('🔍 Extracting Creem subscription data...\n');

  // Method 1: Try to find data in the page's React/Next.js state
  function findReactData() {
    // Look for Next.js data
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent;
      if (content?.includes('subscription')) {
        try {
          // Try to extract JSON data
          const matches = content.match(/(\{[^{}]*"subscription[^{}]*\})/g);
          if (matches) {
            console.log('Found potential subscription data in script tags');
            return matches;
          }
        } catch (_e) {}
      }
    }
    return null;
  }

  // Method 2: Check if there's a table with subscription data
  function extractFromTable() {
    const rows = document.querySelectorAll('table tbody tr, [role="row"]');
    console.log(`Found ${rows.length} table rows`);

    const subscriptions = [];

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td, [role="cell"]');
      if (cells.length === 0) return;

      // Extract text from all cells
      const cellData = Array.from(cells).map((cell) => cell.textContent.trim());
      console.log(`Row ${index + 1}:`, cellData);

      // Try to find subscription ID (starts with sub_)
      const subId = cellData.find((text) => text.startsWith('sub_'));

      if (subId) {
        // Try to extract other info
        const status =
          cellData.find((text) =>
            ['active', 'canceled', 'trialing', 'past_due'].includes(text.toLowerCase())
          ) || 'active';

        const plan = cellData.find((text) => text.toLowerCase().includes('pro')) || 'pro';

        subscriptions.push({
          subscriptionId: subId,
          customerId: 'auto',
          priceId: plan.toLowerCase().includes('plus') ? 'proplus' : 'pro',
          status: status.toLowerCase(),
          interval: 'month',
          periodStart: new Date().toISOString().split('T')[0],
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }
    });

    return subscriptions;
  }

  // Method 3: Intercept network requests
  function setupNetworkInterceptor() {
    console.log('⚠️  Network interception requires page reload.');
    console.log('📋 Next steps:');
    console.log('1. Keep this console open');
    console.log('2. Copy this code:');
    console.log(`
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
        const clone = response.clone();
        clone.json().then(data => {
            if (JSON.stringify(data).includes('sub_')) {
                console.log('🎯 SUBSCRIPTION DATA FOUND:', data);
                window.__CREEM_DATA__ = data;
            }
        }).catch(() => {});
        return response;
    });
};
console.log('✅ Interceptor installed! Now refresh the page (F5)');
        `);
    console.log('3. Paste it in console and press Enter');
    console.log('4. Refresh the page (F5)');
    console.log('5. Run this script again');

    if (window.__CREEM_DATA__) {
      console.log('✅ Found intercepted data!');
      return window.__CREEM_DATA__;
    }

    return null;
  }

  // Method 4: Check window object for data
  function findInWindow() {
    const keys = Object.keys(window);
    for (const key of keys) {
      try {
        const value = window[key];
        if (value && typeof value === 'object') {
          const str = JSON.stringify(value);
          if (str.includes('sub_') && str.includes('subscription')) {
            console.log(`Found data in window.${key}`);
            return value;
          }
        }
      } catch (_e) {}
    }
    return null;
  }

  // Try all methods
  console.log('Method 1: Searching React/Next.js data...');
  let data = findReactData();

  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.log('Method 2: Extracting from table...');
    data = extractFromTable();
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.log('Method 3: Checking window object...');
    data = findInWindow();
  }

  // If we have data, process it
  if (data && Array.isArray(data) && data.length > 0) {
    console.log(`\n✅ Found ${data.length} subscriptions!`);
    console.table(data);

    // Generate CSV
    let csv = 'subscriptionId,customerId,priceId,status,interval,periodStart,periodEnd\n';
    data.forEach((sub) => {
      csv += `${sub.subscriptionId},${sub.customerId},${sub.priceId},${sub.status},${sub.interval},${sub.periodStart},${sub.periodEnd}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creem-subscriptions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('\n✅ CSV file downloaded!');
    console.log('Save it in your project folder and run:');
    console.log('pnpm tsx scripts/import-from-csv.ts');
  } else {
    console.log('\n⚠️  Could not auto-extract data from current page.');
    console.log('\n📋 Please try the network interceptor method:');
    setupNetworkInterceptor();
  }

  // Also show manual extraction option
  console.log('\n\n📝 MANUAL OPTION:');
  console.log('If auto-extraction failed, you can manually copy the subscription IDs.');
  console.log('Look at the page and copy all IDs that start with "sub_"');
  console.log('Then paste them here:');
  console.log(`
// Paste your subscription IDs here (one per line):
const subIds = [
    'sub_xxxxx',
    'sub_yyyyy',
    // ... add all 14
];

// Then run this:
const csv = 'subscriptionId,customerId,priceId,status,interval,periodStart,periodEnd\\n' + 
    subIds.map(id => id + ',auto,pro,active,month,' + 
        new Date().toISOString().split('T')[0] + ',' + 
        new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    ).join('\\n');
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'creem-subscriptions.csv';
document.body.appendChild(a);
a.click();
    `);
})();
