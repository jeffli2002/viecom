// Check user session with Better Auth
// Run this in browser DevTools Console

console.log('=== CHECKING BETTER AUTH SESSION ===\n');

// Better Auth session endpoint
fetch('/api/auth/get-session', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((r) => {
    console.log('Response status:', r.status);
    return r.json();
  })
  .then((data) => {
    console.log('Session Data:', data);
    console.log('\n=== LOGGED IN USER ===');
    console.log('User ID:', data?.user?.id);
    console.log('Email:', data?.user?.email);
    console.log('Name:', data?.user?.name);

    console.log('\n=== EXPECTED (from database) ===');
    console.log('Subscription Owner ID: myZwkau1DoG2GXcibytBYmmwRXX8Mw6L');

    console.log('\n=== MATCH? ===');
    if (data?.user?.id === 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L') {
      console.log('✅ USER IDs MATCH - Upgrade should work!');
      console.log('If upgrade still fails, check server logs for other errors.');
    } else {
      console.log('❌ USER IDs DO NOT MATCH');
      console.log('Logged in user:', data?.user?.id);
      console.log('Subscription owner:', 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L');
      console.log('\nSolution: Log in as the user who owns the subscription');
    }
  })
  .catch((err) => {
    console.error('Error fetching session:', err);
    console.log('\nTrying alternative method...');

    // Alternative: Check subscription API directly
    fetch('/api/creem/subscription', {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((sub) => {
        console.log('\n=== FROM SUBSCRIPTION API ===');
        console.log('Full response:', sub);
      })
      .catch((err2) => console.error('Alternative also failed:', err2));
  });
