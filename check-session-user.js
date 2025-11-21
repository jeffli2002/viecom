// Run this in browser DevTools Console to check session user ID

console.log('=== CHECKING USER SESSION ===');

// Method 1: Check via auth API
fetch('/api/auth/session', {
  credentials: 'include',
})
  .then((r) => r.json())
  .then((session) => {
    console.log('Session User ID:', session?.user?.id);
    console.log('Session User Email:', session?.user?.email);
    console.log('Session User Name:', session?.user?.name);

    // Now check subscription
    return fetch('/api/creem/subscription', {
      credentials: 'include',
    });
  })
  .then((r) => r.json())
  .then((sub) => {
    console.log('\n=== SUBSCRIPTION DATA ===');
    console.log('Subscription User ID:', sub?.subscription?.userId);
    console.log('Subscription ID:', sub?.subscription?.subscriptionId);
    console.log('Payment Record ID:', sub?.subscription?.id);

    console.log('\n=== COMPARISON ===');
    console.log('Do they match?', 'Check if Session User ID matches Subscription User ID above');
  })
  .catch((err) => console.error('Error:', err));
