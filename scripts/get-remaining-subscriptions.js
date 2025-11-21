/**
 * Browser Console Script - Get Remaining 4 Subscriptions (Page 2+)
 *
 * HOW TO USE:
 * 1. Make sure the interceptor is still active in your Creem dashboard
 * 2. Open Console (F12)
 * 3. Paste this script and press Enter
 * 4. It will automatically download a CSV with the remaining subscriptions
 */

(() => {
  console.log('🔍 Searching for remaining subscriptions...\n');

  // Check if we already have data in window.__CREEM_DATA__
  if (window.__CREEM_DATA__ && window.__CREEM_DATA__.length > 0) {
    console.log(`Found ${window.__CREEM_DATA__.length} captured requests`);

    // Extract all subscriptions from captured data
    const allSubscriptions = [];

    window.__CREEM_DATA__.forEach((data) => {
      if (data.subscriptions && data.subscriptions.data) {
        allSubscriptions.push(...data.subscriptions.data);
      } else if (Array.isArray(data.subscriptions)) {
        allSubscriptions.push(...data.subscriptions);
      } else if (data.data && Array.isArray(data.data)) {
        allSubscriptions.push(...data.data);
      }
    });

    console.log(`Total subscriptions found: ${allSubscriptions.length}`);

    if (allSubscriptions.length > 0) {
      exportSubscriptions(allSubscriptions);
      return;
    }
  }

  // Method 2: Try to find pagination controls and trigger next page
  console.log('\n🔄 Looking for pagination controls...');

  const nextButtons = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('a'),
    ...document.querySelectorAll('[role="button"]'),
  ].filter((el) => {
    const text = el.textContent.toLowerCase();
    return text.includes('next') || text.includes('→') || text.includes('>');
  });

  if (nextButtons.length > 0) {
    console.log(`Found ${nextButtons.length} potential "Next" buttons`);
    console.log('Click one of these buttons to load page 2:');
    nextButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.textContent.trim()}"`);
    });
    console.log('\nOR run: nextButtons[0].click()');
    window.nextButtons = nextButtons;
  }

  // Method 3: Manual API call with page 2
  console.log('\n📡 Attempting to fetch page 2 directly...\n');

  // Try different page sizes to capture all
  const attempts = [
    { page: 2, size: 10 },
    { page: 1, size: 20 }, // Get all in one page
    { page: 1, size: 50 }, // Even larger
  ];

  let attemptIndex = 0;

  function tryNextAttempt() {
    if (attemptIndex >= attempts.length) {
      console.log('\n❌ All automatic attempts failed.');
      console.log('\n📝 MANUAL OPTIONS:');
      console.log('\n1. Scroll down to see if more subscriptions load automatically');
      console.log('2. Click the "Next" or pagination button');
      console.log('3. Change the page size dropdown to show more items');
      console.log('\n4. OR manually copy the remaining 4 subscription IDs and add to CSV:');
      console.log(
        '   Format: subscriptionId,customerId,priceId,status,interval,periodStart,periodEnd'
      );
      return;
    }

    const { page, size } = attempts[attemptIndex];
    console.log(`Attempt ${attemptIndex + 1}: Fetching page ${page} with size ${size}...`);

    // Use relative URL to avoid CORS
    fetch(`/api/subscriptions/query?page_size=${size}&page_number=${page}`)
      .then((r) => r.json())
      .then((data) => {
        console.log('✅ Success!', data);

        if (data.subscriptions && data.subscriptions.data) {
          const subs = data.subscriptions.data;
          console.log(`Found ${subs.length} subscriptions`);

          if (subs.length > 0) {
            exportSubscriptions(subs);
          } else {
            console.log('No subscriptions on this page, trying next...');
            attemptIndex++;
            tryNextAttempt();
          }
        } else {
          console.log('Unexpected data format, trying next...');
          attemptIndex++;
          tryNextAttempt();
        }
      })
      .catch((err) => {
        console.log(`❌ Failed: ${err.message}`);
        attemptIndex++;
        tryNextAttempt();
      });
  }

  function exportSubscriptions(subscriptions) {
    console.log('\n📊 Processing subscriptions...\n');

    const csvData = subscriptions.map((sub) => {
      const id = sub.id || sub.subscriptionId || sub.subscription_id;
      const custId =
        sub.customerId || sub.customer_id || sub.customer || 'cust_7ECJrW5ALvuCieDX4W3mOQ';
      const priceId = (sub.priceId || sub.price_id || sub.plan || 'pro').toLowerCase();
      const status = (sub.status || 'active').toLowerCase();
      const interval = sub.interval || sub.billing_interval || 'month';

      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      };

      const periodStart = formatDate(
        sub.currentPeriodStart || sub.current_period_start || sub.periodStart
      );
      const periodEnd = formatDate(sub.currentPeriodEnd || sub.current_period_end || sub.periodEnd);

      return {
        subscriptionId: id,
        customerId: custId,
        priceId: priceId.includes('plus') ? 'proplus' : 'pro',
        status: status,
        interval: interval,
        periodStart: periodStart,
        periodEnd: periodEnd,
      };
    });

    // Filter out duplicates and already imported ones
    const alreadyImported = [
      'sub_5EM6IgULEBVjEtMx5OH0TT',
      'sub_6IW1jzFGNaN8FdSrOaA3at',
      'sub_1z68uVY7AcLLorgzkXj93R',
      'sub_5LrhVdOdAw37py3KZKEVUI',
      'sub_3DfXpCdR59SZqqbXTQbzRt',
      'sub_56V0x19I1f1KiQcEqC9MHU',
      'sub_7HoaWCuBXibsxdl5VpLtzF',
      'sub_A455p9qSOAonUkjw9mKbl',
      'sub_1iFZcIN1yZEOeypa5zsCfD',
      'sub_28XSimfIcwYGy5EaJaObIU',
    ];

    const newSubscriptions = csvData.filter((sub) => !alreadyImported.includes(sub.subscriptionId));

    console.log(`Total found: ${csvData.length}`);
    console.log(`Already imported: ${csvData.length - newSubscriptions.length}`);
    console.log(`New subscriptions: ${newSubscriptions.length}\n`);

    if (newSubscriptions.length === 0) {
      console.log('⚠️  No new subscriptions found!');
      console.log('All subscriptions may already be imported.');
      console.table(csvData);
      return;
    }

    console.table(newSubscriptions);

    // Generate CSV
    let csv = 'subscriptionId,customerId,priceId,status,interval,periodStart,periodEnd\n';
    newSubscriptions.forEach((sub) => {
      csv += `${sub.subscriptionId},${sub.customerId},${sub.priceId},${sub.status},${sub.interval},${sub.periodStart},${sub.periodEnd}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creem-subscriptions-remaining.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('\n✅ CSV file downloaded: creem-subscriptions-remaining.csv');
    console.log('\nNext steps:');
    console.log('1. Save the file in your project folder');
    console.log('2. Append the content to your existing creem-subscriptions.csv');
    console.log('3. Run: pnpm tsx scripts/import-from-csv.ts');
  }

  // Start attempting
  tryNextAttempt();
})();
