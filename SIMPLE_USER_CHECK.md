# Simple User ID Check

## The 403 Error Means:
Your logged-in user ID ≠ Subscription owner user ID

## Quick Check (Browser Console)

**Step 1: Check who's logged in**

Paste this in your browser DevTools Console on the billing page:

```javascript
// Look at the page's store/state
console.log('Checking auth store...');

// Method 1: Check if there's a window variable
if (window.__NEXT_DATA__) {
  console.log('Next.js data:', window.__NEXT_DATA__);
}

// Method 2: Check local storage
console.log('LocalStorage auth:', localStorage.getItem('better-auth.session_token'));

// Method 3: Use the app's own subscription check
fetch('/api/creem/subscription', {credentials: 'include'})
  .then(r => r.json())
  .then(data => {
    console.log('\n=== SUBSCRIPTION API RESPONSE ===');
    console.log('Full response:', data);
    
    if (data.error === 'Unauthorized') {
      console.log('❌ NOT LOGGED IN');
    } else if (data.subscription) {
      console.log('✅ LOGGED IN');
      console.log('Has subscription data');
    } else {
      console.log('⚠️ Logged in but no subscription');
    }
  });
```

**Step 2: Check server logs**

Look at your terminal where `pnpm dev` is running. When you click upgrade, you should see:

```
[Creem Subscription Upgrade] Processing upgrade request: {
  subscriptionId: 'sub_6IW1jzFGNaN8FdSrOaA3at',
  userId: 'SOME_USER_ID',
  userEmail: 'some@email.com'
}

[Creem Subscription Upgrade] User mismatch: {
  subscriptionId: 'sub_6IW1jzFGNaN8FdSrOaA3at',
  paymentUserId: 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',
  sessionUserId: 'DIFFERENT_USER_ID'  ← This will show who's logged in
}
```

## Solution Based on Server Logs

### If server logs show different user IDs:

**Option A: Log out and log in as correct user**

1. Find the correct user's email:
```sql
SELECT email, name 
FROM "user" 
WHERE id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L';
```

2. Log out from your app
3. Log in with that email

**Option B: Assign subscription to current user**

If you want the current user to own the subscription:

```sql
-- Get current user ID from server logs first
-- Then update:

UPDATE payment
SET user_id = 'CURRENT_USER_ID_FROM_LOGS'
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';
```

## If No Server Logs Appear

If clicking upgrade doesn't show ANY logs in terminal:

1. **Check Network tab** in DevTools:
   - Look for request to `/api/creem/subscription/sub_6IW1jzFGNaN8FdSrOaA3at/upgrade`
   - Check the response
   
2. **Possible issues**:
   - Not logged in at all
   - Session expired
   - Frontend not sending the request

## Expected Flow

When upgrade works correctly:

```
Terminal logs:
[Creem Subscription Upgrade] Processing upgrade request
[Creem Subscription Upgrade] Scheduled upgrade set

Browser shows:
Toast: "Your plan will upgrade at the end of the current period"
Purple alert: "Plan Upgrade Scheduled: Pro+"
```

## Quick Test Without Logs

Run this SQL to see ALL users with subscriptions:

```sql
SELECT 
    u.email,
    u.name,
    u.id as user_id,
    p.subscription_id,
    p.price_id,
    p.status
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE p.status IN ('active', 'trialing')
  AND p.provider = 'creem';
```

Then log in with one of those emails and try upgrade again.
