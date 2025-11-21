# Regenerate Creem API Key - Step by Step

## Quick Steps

### 1. Go to Creem Dashboard
- Open https://dashboard.creem.io (or your Creem dashboard URL)
- Make sure you're in **Test Mode** (toggle usually in top-right corner)

### 2. Find API Keys Section
Look for one of these menu items:
- "Developers" → "API Keys"
- "Settings" → "API Keys"
- "API Keys" (direct menu item)

### 3. Create New API Key
1. Click **"Create API Key"** or **"Generate New Key"** button
2. Give it a name (e.g., "Dev Server Key - New")
3. Make sure it's for **Test Mode**
4. Click Create/Generate
5. **IMPORTANT:** Copy the key immediately (you'll only see it once\!)
   - It should start with `creem_test_...`

### 4. Update Your .env.local

Open `.env.local` file and replace the old key:

```bash
# Before:
CREEM_API_KEY="creem_test_OLD_KEY_HERE"

# After:
CREEM_API_KEY="creem_test_NEW_KEY_HERE"
```

**Save the file\!**

### 5. Restart Dev Server

In PowerShell where `pnpm dev` is running:
```powershell
# Press Ctrl+C to stop

# Restart
pnpm dev

# Wait for "Ready" message
```

### 6. Test Upgrade Again

1. Refresh your browser (F5)
2. Go to billing page
3. Click "Upgrade to Pro+"
4. **Should work now\!** ✅

## What to Look For

**If it works:**
- ✅ Terminal shows: `[Creem Subscription Upgrade] Scheduled upgrade set`
- ✅ Browser shows: Purple alert "Plan Upgrade Scheduled"
- ✅ No 403 error\!

**If still 403:**
- This is definitely a Creem account/API restriction
- You'll need to contact Creem support
- Or use a workaround (I can help implement)

## Why This Might Fix It

Sometimes API keys get into a weird state where:
- They work for read operations (fetching data)
- But fail for write operations (modifying subscriptions)
- Regenerating creates a fresh key with proper state

This is common with payment API providers - a fresh key often resolves mysterious 403 errors.

## Alternative If You Can't Find API Keys Section

Some Creem accounts might have different dashboard layouts. If you can't find API Keys:

**Look for:**
- "Account Settings"
- "Integration Settings"
- "Developer Tools"
- Settings icon (gear/cog) → Look for API-related options

**Or:**
Take a screenshot of your Creem dashboard menu/sidebar and I can help you find where API keys are located.

## After Testing

Let me know the result:
- ✅ **Works\!** → Great\! Your upgrade flow is complete
- ❌ **Still 403** → We'll contact Creem support or implement workaround
